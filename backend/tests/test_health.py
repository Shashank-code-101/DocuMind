"""Basic health-check test — verifies the API starts and responds."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "DocuMind API"
    assert data["version"] == "0.1.0"


def test_openapi_schema():
    """Verify that FastAPI generated the OpenAPI schema for all routes without schema errors."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert schema["info"]["title"] == "DocuMind API"
    assert "/api/health" in schema["paths"]
    assert "/api/auth/register" in schema["paths"]
    assert "/api/auth/login" in schema["paths"]
    assert "/api/workspaces" in schema["paths"]
