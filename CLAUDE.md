# ReceptAI — context for Claude Code

This file is auto-loaded into every Claude Code session in this repo.

## Project at a glance

Mobile app (Expo + React Native, TypeScript) where a user photographs the
inside of their fridge, the backend detects products with YOLO, the matching
service finds dishes from a Postgres DB whose ingredient lists are covered by
the detected products, and OpenAI generates a step-by-step recipe.

Pipeline:
```
iPhone (Expo)
  └─ photo
      └─ POST /detect-products            (multipart)
          └─ Backend: ml/detector.py → YOLOv11s best.pt
              └─ [{name, confidence}]
                  └─ POST /dishes/find    (matching, ≤2 missing ingredients)
                      └─ DishOut[]
                          └─ POST /generate-recipe (OpenAI gpt-4o-mini)
                              └─ {title, ingredients, steps, ...}
                                  └─ POST /history (after cooking)
```

## Tree

- `backend/` — FastAPI + async SQLAlchemy + Postgres (asyncpg). Async lifespan
  creates tables on startup. Endpoints: `auth.py`, `products.py`, `dishes.py`,
  `history.py`. ML wrapper at `ml/detector.py`. OpenAI wrapper at
  `services/recipe_generator.py`. Schemas in `schemas/__init__.py`. Settings
  via `pydantic-settings` in `db.py`. Seed script: `seed_dishes.py`.
  Sanity check script: `check_setup.py`.
- `frontend/` — Expo 54 + React Native 0.81 + React 19. Navigation: bottom
  tabs (Home/History/Profile) + modal stack (RecognizedProducts → RecipeList
  → RecipeDetail → CookingMode) + auth stack (Login/Register). API client at
  `src/services/api.ts`, theme at `src/theme/index.ts`.
- `ml_model/` — YOLO training pipeline. Trained model: `best.pt` lives at
  `ml_model/models/fridgify_y11s_full/weights/best.pt` (gitignored, must be
  downloaded from GitHub Release).
- `ml_model/scripts/` — `train_yolo11s_full.py`, `audit_dataset.py`,
  `predict.py`, `eval_ood.py`, etc.

## Trained model facts

YOLOv11s, 300 epochs, fridgify_v4 (Roboflow, 58 classes, 14k images).

| | In-distribution test (Roboflow Fridgify v4 test split) | OOD (Smart-Fridge subset, 300 imgs) |
|--|--|--|
| mAP50 | 0.986 | 0.510 |
| mAP50-95 | **0.886** | 0.328 |
| Precision | 0.972 | 0.723 |
| Recall | 0.970 | 0.380 |

OOD failure analysis is in
`ml_model/models/fridgify_y11s_full/ood_eval/REPORT.md`.

## Cross-platform conventions

- All training/eval scripts auto-pick device (`cuda` → `mps` → `cpu`).
- Backend `.env` uses relative path for `YOLO_MODEL_PATH`, resolved from CWD
  (so `uvicorn main:app` must be run from `backend/`).
- Frontend reads API URL from `EXPO_PUBLIC_API_URL` env var with fallback to
  `http://192.168.1.162:8000`. Set this before `npx expo start` so iPhone
  can reach the Mac backend over LAN.
- Two venv folders coexist: `venv/` (Mac, gitignored) and `.venv-win/`
  (Windows training, gitignored). Always create a fresh venv on each machine.

## Things to know before editing

- `Dish.ingredients` is `JSONB` (list of strings). Names must match YOLO
  class names verbatim (lower-case, e.g. `"egg"`, `"bell pepper"` — see
  `ml_model/datasets/fridgify_v4/data.yaml` for the canonical list).
- Frontend nav params types live in `src/navigation/AppNavigator.tsx`
  (`RootStackParamList`).
- Frontend types match backend Pydantic schemas; if you change one, change
  both (`backend/schemas/__init__.py` ↔ `frontend/src/services/api.ts`).
- DB schema is created via `Base.metadata.create_all` on lifespan — no
  Alembic migrations yet. Adding a column requires drop+recreate or a
  manual migration.
- Don't commit weights (`*.pt`) — they go in GitHub Releases. Don't commit
  `.env`, `.roboflow*` (gitignored).

## Recent state (2026-05-01)

See `HANDOFF.md` for full context. Short version: training is done, frontend
↔ backend wiring is complete, all 6 screens use real API. Ready for Mac
deploy + iPhone testing via Expo Go.
