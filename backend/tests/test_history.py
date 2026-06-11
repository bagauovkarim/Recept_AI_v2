async def test_history_requires_auth(client):
    assert (await client.get("/history")).status_code == 401
    assert (await client.post("/history", json={"dish_id": 1})).status_code == 401


async def test_create_history_for_existing_dish(client, auth_headers, seeded_dishes):
    dish_id = seeded_dishes[0].id
    resp = await client.post(
        "/history",
        json={"dish_id": dish_id, "image_uri": "file:///tmp/img.jpg"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["dish_id"] == dish_id
    assert body["dish_title"] == "Омлет с овощами"
    assert body["image_uri"] == "file:///tmp/img.jpg"


async def test_create_history_missing_dish_returns_404(client, auth_headers):
    resp = await client.post(
        "/history",
        json={"dish_id": 9999},
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_list_history_only_for_current_user(client, auth_headers, seeded_dishes):
    dish_id = seeded_dishes[0].id
    # current user adds an entry
    await client.post("/history", json={"dish_id": dish_id}, headers=auth_headers)

    # someone else registers and gets their own (empty) history
    other = await client.post(
        "/auth/register",
        json={"email": "other@example.com", "password": "abcdef"},
    )
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}
    other_list = await client.get("/history", headers=other_headers)
    assert other_list.status_code == 200
    assert other_list.json() == []

    own_list = await client.get("/history", headers=auth_headers)
    assert own_list.status_code == 200
    assert len(own_list.json()) == 1


async def test_delete_own_history_entry(client, auth_headers, seeded_dishes):
    created = await client.post(
        "/history",
        json={"dish_id": seeded_dishes[0].id},
        headers=auth_headers,
    )
    entry_id = created.json()["id"]

    deleted = await client.delete(f"/history/{entry_id}", headers=auth_headers)
    assert deleted.status_code == 204

    # second delete of same entry -> 404
    again = await client.delete(f"/history/{entry_id}", headers=auth_headers)
    assert again.status_code == 404


async def test_delete_other_users_entry_not_found(client, auth_headers, seeded_dishes):
    created = await client.post(
        "/history",
        json={"dish_id": seeded_dishes[0].id},
        headers=auth_headers,
    )
    entry_id = created.json()["id"]

    other = await client.post(
        "/auth/register",
        json={"email": "intruder@example.com", "password": "abcdef"},
    )
    intruder = {"Authorization": f"Bearer {other.json()['access_token']}"}
    resp = await client.delete(f"/history/{entry_id}", headers=intruder)
    assert resp.status_code == 404
