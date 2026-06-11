async def test_find_dishes_requires_auth(client):
    resp = await client.post("/dishes/find", json={"ingredients": ["egg"]})
    assert resp.status_code == 401


async def test_find_dishes_exact_match(client, auth_headers, seeded_dishes):
    resp = await client.post(
        "/dishes/find",
        json={"ingredients": ["egg", "tomato", "onion"]},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    titles = [d["title"] for d in resp.json()]
    assert "Омлет с овощами" in titles
    omelette = next(d for d in resp.json() if d["title"] == "Омлет с овощами")
    assert omelette["missing_count"] == 0
    assert omelette["missing_ingredients"] == []


async def test_find_dishes_with_two_missing_threshold(client, auth_headers, seeded_dishes):
    # We have 3 of 4 chicken-soup ingredients -> 1 missing, should be returned.
    resp = await client.post(
        "/dishes/find",
        json={"ingredients": ["chicken", "carrot", "onion"]},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    soup = next((d for d in resp.json() if d["title"] == "Куриный суп"), None)
    assert soup is not None
    assert soup["missing_count"] == 1
    assert soup["missing_ingredients"] == ["potato"]


async def test_find_dishes_exceeding_threshold_excluded(client, auth_headers, seeded_dishes):
    # Only one ingredient of the 5-ingredient salad -> 4 missing -> excluded.
    resp = await client.post(
        "/dishes/find",
        json={"ingredients": ["lettuce"]},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    titles = [d["title"] for d in resp.json()]
    assert "Салат сложный" not in titles


async def test_find_dishes_ordered_by_missing_then_difficulty(client, auth_headers, seeded_dishes):
    resp = await client.post(
        "/dishes/find",
        json={"ingredients": ["potato", "onion", "tomato", "egg", "chicken", "carrot"]},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    matched = resp.json()
    missing_counts = [d["missing_count"] for d in matched]
    assert missing_counts == sorted(missing_counts), "primary sort by missing_count"


async def test_get_dish_by_id(client, auth_headers, seeded_dishes):
    target_id = seeded_dishes[0].id
    resp = await client.get(f"/dishes/{target_id}", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Омлет с овощами"
    assert body["difficulty"] == "easy"
    assert set(body["ingredients"]) == {"egg", "tomato", "onion"}


async def test_get_dish_404(client, auth_headers, seeded_dishes):
    resp = await client.get("/dishes/9999", headers=auth_headers)
    assert resp.status_code == 404
