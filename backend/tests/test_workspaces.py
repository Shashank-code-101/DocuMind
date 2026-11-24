"""
Tests for Workspace Management and User Isolation:
- Create workspace
- List workspaces (only returns user's own)
- Get workspace by ID
- Update workspace
- Delete workspace
- Strict user isolation: user A cannot access or delete user B's workspace
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import Base, engine

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def register_and_get_token(email: str, name: str = "Test User") -> str:
    client.post("/api/auth/register", json={
        "full_name": name,
        "email": email,
        "password": "Password123",
        "confirm_password": "Password123",
    })
    res = client.post("/api/auth/login", json={
        "email": email,
        "password": "Password123",
    })
    return res.json()["access_token"]


def test_create_and_list_workspaces():
    token = register_and_get_token("user1@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create workspace
    create_res = client.post("/api/workspaces", json={
        "name": "Machine Learning Papers",
        "description": "Collection of transformer research",
    }, headers=headers)
    assert create_res.status_code == 201
    ws = create_res.json()
    assert ws["name"] == "Machine Learning Papers"
    assert ws["description"] == "Collection of transformer research"
    assert ws["document_count"] == 0

    # List workspaces
    list_res = client.get("/api/workspaces", headers=headers)
    assert list_res.status_code == 200
    workspaces = list_res.json()
    assert len(workspaces) == 1
    assert workspaces[0]["id"] == ws["id"]


def test_update_and_delete_workspace():
    token = register_and_get_token("user1@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create
    create_res = client.post("/api/workspaces", json={"name": "Old Name"}, headers=headers)
    ws_id = create_res.json()["id"]

    # Update
    patch_res = client.patch(f"/api/workspaces/{ws_id}", json={
        "name": "New Name",
        "description": "Updated description",
    }, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "New Name"
    assert patch_res.json()["description"] == "Updated description"

    # Delete
    del_res = client.delete(f"/api/workspaces/{ws_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify not found
    get_res = client.get(f"/api/workspaces/{ws_id}", headers=headers)
    assert get_res.status_code == 404


def test_user_isolation():
    # User A creates a workspace
    token_a = register_and_get_token("userA@example.com", "User A")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    create_res = client.post("/api/workspaces", json={"name": "User A Workspace"}, headers=headers_a)
    ws_id_a = create_res.json()["id"]

    # User B registers
    token_b = register_and_get_token("userB@example.com", "User B")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B lists workspaces -> should be empty
    list_b = client.get("/api/workspaces", headers=headers_b)
    assert list_b.status_code == 200
    assert len(list_b.json()) == 0

    # User B tries to view User A's workspace -> 404
    get_b = client.get(f"/api/workspaces/{ws_id_a}", headers=headers_b)
    assert get_b.status_code == 404

    # User B tries to patch User A's workspace -> 404
    patch_b = client.patch(f"/api/workspaces/{ws_id_a}", json={"name": "Hacked Name"}, headers=headers_b)
    assert patch_b.status_code == 404

    # User B tries to delete User A's workspace -> 404
    del_b = client.delete(f"/api/workspaces/{ws_id_a}", headers=headers_b)
    assert del_b.status_code == 404

    # User A can still access their workspace
    get_a = client.get(f"/api/workspaces/{ws_id_a}", headers=headers_a)
    assert get_a.status_code == 200
    assert get_a.json()["name"] == "User A Workspace"
