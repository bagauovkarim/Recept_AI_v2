async def test_shopping_requires_auth(client):
    assert (await client.get("/shopping-list")).status_code == 401


async def test_add_and_list_item(client, auth_headers):
    add = await client.post("/shopping-list", json={"name": "Молоко"}, headers=auth_headers)
    assert add.status_code == 201
    assert add.json()["name"] == "Молоко"
    assert add.json()["purchased"] is False

    lst = await client.get("/shopping-list", headers=auth_headers)
    assert lst.status_code == 200
    assert [i["name"] for i in lst.json()] == ["Молоко"]


async def test_add_item_duplicate_returns_existing(client, auth_headers):
    first = await client.post("/shopping-list", json={"name": "egg"}, headers=auth_headers)
    second = await client.post("/shopping-list", json={"name": "egg"}, headers=auth_headers)
    assert first.json()["id"] == second.json()["id"]
    lst = await client.get("/shopping-list", headers=auth_headers)
    assert len(lst.json()) == 1


async def test_bulk_add(client, auth_headers):
    bulk = await client.post(
        "/shopping-list/bulk",
        json={"names": ["лук", "морковь", "лук", "  ", "картофель"]},
        headers=auth_headers,
    )
    assert bulk.status_code == 201
    names = [i["name"] for i in bulk.json()]
    # duplicates and whitespace-only entries must be dropped
    assert set(names) == {"лук", "морковь", "картофель"}


async def test_bulk_add_skips_existing(client, auth_headers):
    await client.post("/shopping-list", json={"name": "лук"}, headers=auth_headers)
    bulk = await client.post(
        "/shopping-list/bulk",
        json={"names": ["лук", "морковь"]},
        headers=auth_headers,
    )
    assert bulk.status_code == 201
    # only "морковь" is new
    assert [i["name"] for i in bulk.json()] == ["морковь"]


async def test_patch_purchased(client, auth_headers):
    created = await client.post("/shopping-list", json={"name": "хлеб"}, headers=auth_headers)
    item_id = created.json()["id"]

    patched = await client.patch(
        f"/shopping-list/{item_id}",
        json={"purchased": True},
        headers=auth_headers,
    )
    assert patched.status_code == 200
    assert patched.json()["purchased"] is True


async def test_patch_nonexistent_404(client, auth_headers):
    resp = await client.patch(
        "/shopping-list/9999",
        json={"purchased": True},
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_delete_item(client, auth_headers):
    created = await client.post("/shopping-list", json={"name": "хлеб"}, headers=auth_headers)
    item_id = created.json()["id"]

    deleted = await client.delete(f"/shopping-list/{item_id}", headers=auth_headers)
    assert deleted.status_code == 204

    again = await client.delete(f"/shopping-list/{item_id}", headers=auth_headers)
    assert again.status_code == 404


async def test_clear_purchased(client, auth_headers):
    a = await client.post("/shopping-list", json={"name": "a"}, headers=auth_headers)
    b = await client.post("/shopping-list", json={"name": "b"}, headers=auth_headers)
    await client.patch(
        f"/shopping-list/{a.json()['id']}",
        json={"purchased": True},
        headers=auth_headers,
    )

    cleared = await client.delete("/shopping-list/purchased/all", headers=auth_headers)
    assert cleared.status_code == 204

    lst = await client.get("/shopping-list", headers=auth_headers)
    remaining = [i["name"] for i in lst.json()]
    assert remaining == ["b"]


async def test_shopping_isolation_per_user(client, auth_headers):
    await client.post("/shopping-list", json={"name": "mine"}, headers=auth_headers)
    other = await client.post(
        "/auth/register",
        json={"email": "other@example.com", "password": "abcdef"},
    )
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}
    assert (await client.get("/shopping-list", headers=other_headers)).json() == []
