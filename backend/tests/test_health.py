from fastapi.testclient import TestClient
import sys
import os

# Add backend dir to path for test runner
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "Smart Attendance" in data["service"]

def test_login_api():
    response = client.post("/api/v1/auth/login", json={"email": "teacher@college.edu", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "TEACHER"
    assert "token" in data

def test_students_list_api():
    response = client.get("/api/v1/students")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_classes_list_api():
    response = client.get("/api/v1/classes")
    assert response.status_code == 200
    assert len(response.json()) >= 1
