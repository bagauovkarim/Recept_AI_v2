async def test_register_returns_token(client):
    resp = await client.post(
        "/auth/register",
        json={"email": "u1@example.com", "password": "abcdef"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str) and body["access_token"]


async def test_register_duplicate_email_400(client):
    payload = {"email": "dup@example.com", "password": "abcdef"}
    first = await client.post("/auth/register", json=payload)
    assert first.status_code == 201
    second = await client.post("/auth/register", json=payload)
    assert second.status_code == 400
    assert "exist" in second.json()["detail"].lower()


async def test_register_short_password_validation(client):
    resp = await client.post(
        "/auth/register",
        json={"email": "short@example.com", "password": "123"},
    )
    assert resp.status_code == 422


async def test_register_invalid_email(client):
    resp = await client.post(
        "/auth/register",
        json={"email": "not-an-email", "password": "abcdef"},
    )
    assert resp.status_code == 422


async def test_login_success_and_failure(client):
    await client.post("/auth/register", json={"email": "lg@example.com", "password": "abcdef"})

    ok = await client.post("/auth/login", json={"email": "lg@example.com", "password": "abcdef"})
    assert ok.status_code == 200
    assert ok.json()["access_token"]

    bad_pw = await client.post("/auth/login", json={"email": "lg@example.com", "password": "wrong"})
    assert bad_pw.status_code == 401

    no_user = await client.post("/auth/login", json={"email": "ghost@example.com", "password": "abcdef"})
    assert no_user.status_code == 401


async def test_me_requires_auth(client, auth_headers):
    no_auth = await client.get("/auth/me")
    assert no_auth.status_code == 401

    with_auth = await client.get("/auth/me", headers=auth_headers)
    assert with_auth.status_code == 200
    assert with_auth.json()["email"] == "tester@example.com"


async def test_me_invalid_token(client):
    resp = await client.get("/auth/me", headers={"Authorization": "Bearer not.a.jwt"})
    assert resp.status_code == 401


async def test_change_password_flow(client, auth_headers):
    # wrong current password
    bad = await client.post(
        "/auth/change-password",
        json={"current_password": "wrong", "new_password": "newpass1"},
        headers=auth_headers,
    )
    assert bad.status_code == 401

    # success
    ok = await client.post(
        "/auth/change-password",
        json={"current_password": "secret123", "new_password": "newpass1"},
        headers=auth_headers,
    )
    assert ok.status_code == 200
    new_token = ok.json()["access_token"]
    assert new_token

    # old password no longer works
    old_login = await client.post(
        "/auth/login",
        json={"email": "tester@example.com", "password": "secret123"},
    )
    assert old_login.status_code == 401

    # new password works
    new_login = await client.post(
        "/auth/login",
        json={"email": "tester@example.com", "password": "newpass1"},
    )
    assert new_login.status_code == 200


async def test_change_email_flow(client, auth_headers):
    # wrong password
    bad = await client.post(
        "/auth/change-email",
        json={"new_email": "renamed@example.com", "password": "wrong"},
        headers=auth_headers,
    )
    assert bad.status_code == 401

    # email already taken by someone else
    await client.post("/auth/register", json={"email": "taken@example.com", "password": "abcdef"})
    taken = await client.post(
        "/auth/change-email",
        json={"new_email": "taken@example.com", "password": "secret123"},
        headers=auth_headers,
    )
    assert taken.status_code == 400

    # success
    ok = await client.post(
        "/auth/change-email",
        json={"new_email": "renamed@example.com", "password": "secret123"},
        headers=auth_headers,
    )
    assert ok.status_code == 200
    assert ok.json()["email"] == "renamed@example.com"
