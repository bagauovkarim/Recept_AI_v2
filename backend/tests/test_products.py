import io

import pytest
from PIL import Image

from schemas import DetectedProduct


def _png_bytes(size=(64, 64), color=(200, 30, 30)) -> bytes:
    img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture(autouse=True)
def stub_detector(monkeypatch):
    import routers.products as products_mod

    def fake_detect(image):
        return [
            DetectedProduct(name="tomato", confidence=0.91),
            DetectedProduct(name="onion", confidence=0.74),
        ]

    monkeypatch.setattr(products_mod, "detect_products", fake_detect)


async def test_detect_requires_auth(client):
    files = {"file": ("a.png", _png_bytes(), "image/png")}
    resp = await client.post("/detect-products", files=files)
    assert resp.status_code == 401


async def test_detect_returns_products(client, auth_headers):
    files = {"file": ("a.png", _png_bytes(), "image/png")}
    resp = await client.post("/detect-products", files=files, headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert {p["name"] for p in body} == {"tomato", "onion"}
    assert all(0.0 <= p["confidence"] <= 1.0 for p in body)


async def test_detect_rejects_wrong_content_type(client, auth_headers):
    files = {"file": ("doc.pdf", b"%PDF-1.4 garbage", "application/pdf")}
    resp = await client.post("/detect-products", files=files, headers=auth_headers)
    assert resp.status_code == 400
    assert "JPEG" in resp.json()["detail"] or "JPG" in resp.json()["detail"].upper()


async def test_detect_rejects_oversize_file(client, auth_headers):
    big = b"\xff" * (11 * 1024 * 1024)
    files = {"file": ("huge.jpg", big, "image/jpeg")}
    resp = await client.post("/detect-products", files=files, headers=auth_headers)
    assert resp.status_code == 400
    assert "10MB" in resp.json()["detail"] or "большой" in resp.json()["detail"].lower()


async def test_detect_rejects_corrupt_image(client, auth_headers):
    files = {"file": ("not.jpg", b"these bytes are not an image", "image/jpeg")}
    resp = await client.post("/detect-products", files=files, headers=auth_headers)
    assert resp.status_code == 400
