"""Sanity-check that all backend modules import cleanly and settings resolve."""
from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

print("--- Importing all backend modules ---")
import db
print("db OK")
import models.user, models.dish, models.history
print("models OK")
import schemas
print("schemas OK")
import routers.auth, routers.products, routers.dishes, routers.history
print("routers OK")
import services.recipe_generator
print("services OK")
import ml.detector
print("ml.detector OK")
import main
print("main OK")

print("\n--- App routes ---")
for r in main.app.routes:
    if hasattr(r, "path") and hasattr(r, "methods"):
        methods = sorted(r.methods - {"HEAD", "OPTIONS"})
        if methods:
            joined = ",".join(methods)
            print(f"  {joined:<10} {r.path}")

print("\n--- Settings sanity ---")
s = db.get_settings()
import pathlib
print(f"  YOLO_MODEL_PATH (raw): {s.YOLO_MODEL_PATH}")
abs_path = pathlib.Path(s.YOLO_MODEL_PATH).resolve()
print(f"  Resolved abs path:    {abs_path}")
print(f"  Exists:               {abs_path.exists()}")
print(f"  Model size:           {abs_path.stat().st_size if abs_path.exists() else 'N/A'} bytes")
print(f"  CONFIDENCE_THRESHOLD: {s.CONFIDENCE_THRESHOLD}")
print(f"  ALGORITHM:            {s.ALGORITHM}")
print(f"  ACCESS_TOKEN_EXPIRE_MINUTES: {s.ACCESS_TOKEN_EXPIRE_MINUTES}")
print(f"  DATABASE_URL:         {s.DATABASE_URL.split('@')[-1] if '@' in s.DATABASE_URL else s.DATABASE_URL}")
print(f"  OPENAI_API_KEY set:   {bool(s.OPENAI_API_KEY) and s.OPENAI_API_KEY != 'your_openai_api_key_here'}")
