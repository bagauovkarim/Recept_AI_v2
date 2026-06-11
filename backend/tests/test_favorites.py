async def test_favorites_require_auth(client):
    assert (await client.get("/favorites")).status_code == 401
    assert (await client.post("/favorites", json={"dish_id": 1})).status_code == 401
    assert (await client.delete("/favorites/1")).status_code == 401


async def test_add_favorite_dish_not_found(client, auth_headers):
    resp = await client.post("/favorites", json={"dish_id": 9999}, headers=auth_headers)
    assert resp.status_code == 404


async def test_add_and_list_favorite(client, auth_headers, seeded_dishes):
    dish = seeded_dishes[0]
    add = await client.post("/favorites", json={"dish_id": dish.id}, headers=auth_headers)
    assert add.status_code == 201
    body = add.json()
    assert body["dish_id"] == dish.id
    assert body["dish_title"] == dish.title
    assert body["difficulty"] == dish.difficulty

    lst = await client.get("/favorites", headers=auth_headers)
    assert lst.status_code == 200
    items = lst.json()
    assert len(items) == 1
    assert items[0]["dish_id"] == dish.id


async def test_add_favorite_duplicate_is_idempotent(client, auth_headers, seeded_dishes):
    dish_id = seeded_dishes[0].id
    first = await client.post("/favorites", json={"dish_id": dish_id}, headers=auth_headers)
    assert first.status_code == 201

    # second call must not raise on UNIQUE — should return existing favorite
    second = await client.post("/favorites", json={"dish_id": dish_id}, headers=auth_headers)
    assert second.status_code == 201
    assert second.json()["id"] == first.json()["id"]

    lst = await client.get("/favorites", headers=auth_headers)
    assert len(lst.json()) == 1


async def test_remove_favorite(client, auth_headers, seeded_dishes):
    dish_id = seeded_dishes[0].id
    await client.post("/favorites", json={"dish_id": dish_id}, headers=auth_headers)

    deleted = await client.delete(f"/favorites/{dish_id}", headers=auth_headers)
    assert deleted.status_code == 204

    lst = await client.get("/favorites", headers=auth_headers)
    assert lst.json() == []

    # deleting a non-favorite is also OK (204) — idempotent endpoint
    again = await client.delete(f"/favorites/{dish_id}", headers=auth_headers)
    assert again.status_code == 204


async def test_favorites_are_per_user(client, auth_headers, seeded_dishes):
    await client.post(
        "/favorites",
        json={"dish_id": seeded_dishes[0].id},
        headers=auth_headers,
    )
    other = await client.post(
        "/auth/register",
        json={"email": "other@example.com", "password": "abcdef"},
    )
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}
    assert (await client.get("/favorites", headers=other_headers)).json() == []
