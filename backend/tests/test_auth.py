"""
Tests for Authentication:
- User registration (valid fields, duplicate email rejection, validation rules)
- User login (valid credentials, invalid password, nonexistent user)
- JWT token generation & verification
- Protected endpoint access (/api/auth/me) with and without token
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import SessionLocal, Base, engine
from app.database.models.user import User

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    """Ensure a clean database before each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_register_success():
    payload = {
        "full_name": "Alice Smith",
        "email": "alice@example.com",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "alice@example.com"
    assert data["full_name"] == "Alice Smith"
    assert "id" in data
    assert "password" not in data
    assert "password_hash" not in data


def test_register_duplicate_email():
    payload = {
        "full_name": "Bob Jones",
        "email": "bob@example.com",
        "password": "Password123",
        "confirm_password": "Password123",
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    # Duplicate registration
    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()


def test_register_password_mismatch():
    payload = {
        "full_name": "Charlie",
        "email": "charlie@example.com",
        "password": "Password123",
        "confirm_password": "DifferentPassword123",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_register_weak_password():
    payload = {
        "full_name": "Charlie",
        "email": "charlie@example.com",
        "password": "weak",
        "confirm_password": "weak",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success():
    # Register first
    client.post("/api/auth/register", json={
        "full_name": "Dana White",
        "email": "dana@example.com",
        "password": "MyStrongPassword1",
        "confirm_password": "MyStrongPassword1",
    })

    # Login
    response = client.post("/api/auth/login", json={
        "email": "dana@example.com",
        "password": "MyStrongPassword1",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_incorrect_password():
    client.post("/api/auth/register", json={
        "full_name": "Dana White",
        "email": "dana2@example.com",
        "password": "MyStrongPassword1",
        "confirm_password": "MyStrongPassword1",
    })

    response = client.post("/api/auth/login", json={
        "email": "dana2@example.com",
        "password": "WrongPassword999",
    })
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


def test_get_current_user():
    # Register and login
    client.post("/api/auth/register", json={
        "full_name": "Eve Davis",
        "email": "eve@example.com",
        "password": "Password123",
        "confirm_password": "Password123",
    })
    login_res = client.post("/api/auth/login", json={
        "email": "eve@example.com",
        "password": "Password123",
    })
    token = login_res.json()["access_token"]

    # Call /api/auth/me with bearer token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    user = me_res.json()
    assert user["email"] == "eve@example.com"
    assert user["full_name"] == "Eve Davis"


def test_get_current_user_unauthorized():
    # Request without token
    res1 = client.get("/api/auth/me")
    assert res1.status_code == 401

    # Request with invalid token
    res2 = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.value"})
    assert res2.status_code == 401


def test_logout():
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
