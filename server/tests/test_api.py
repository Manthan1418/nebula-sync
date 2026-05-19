from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_items_crud():
    # ensure empty or list
    r = client.get("/items")
    assert r.status_code == 200
    assert isinstance(r.json(), list)

    item = {"id": 1, "name": "Track A", "description": "desc"}
    r = client.post("/items", json=item)
    assert r.status_code == 200
    assert r.json() == item

    r = client.get("/items")
    assert r.status_code == 200
    assert r.json() == [item]
