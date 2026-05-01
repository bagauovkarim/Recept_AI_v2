# SETUP — запуск ReceptAI на macOS + iPhone

Пошаговая инструкция для развёртывания после `git clone` на Mac.

## 0. Что нужно установить заранее на Mac

```bash
# Homebrew (если ещё нет)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Python 3.11 (точно совпадает с тренировочным)
brew install python@3.11

# Node + npm
brew install node

# PostgreSQL — у тебя уже стоит, проверь:
brew services list | grep postgres
# Если нет, поставь и запусти:
brew install postgresql@16
brew services start postgresql@16
```

На iPhone:
- App Store → **Expo Go** (бесплатно).
- iPhone и Mac в **одной WiFi сети**.

## 1. Скачать проект

```bash
git clone https://github.com/bagauovkarim/Recept_AI_v2.git
cd Recept_AI_v2
```

## 2. Положить веса YOLO (best.pt, ~19 МБ)

Файл `best.pt` не в git (gitignored как `*.pt`). Перенеси с Windows на Mac
любым способом:

- **iCloud Drive** — перетащи файл в папку iCloud на Windows, на Mac он
  автоматически появится
- **AirDrop посредством iPhone** — отправь с Windows на iPhone (через
  «Send Anywhere» или подобное приложение), затем AirDrop с iPhone на Mac
- **USB-флешка** — копируй прямой
- **GitHub Release** (если хочешь запостить навсегда):
  ```bash
  brew install gh
  gh auth login
  cd Recept_AI_v2
  gh release create v0.1.0 \
    /path/to/best.pt \
    --title "v0.1.0 — trained YOLO11s weights" \
    --notes "Trained on Roboflow Fridgify v4 (300 epochs, mAP50-95 = 0.886)"
  ```

Затем положи файл в нужное место:

```bash
mkdir -p ml_model/models/fridgify_y11s_full/weights
mv ~/Downloads/best.pt ml_model/models/fridgify_y11s_full/weights/best.pt

# Проверка размера (должно быть ~19 МБ)
ls -lh ml_model/models/fridgify_y11s_full/weights/best.pt
```

## 3. Бэкенд — создать venv и поставить зависимости

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 4. БД — убедиться что Postgres работает и есть пользователь+база

В существующих настройках `.env` строка:
```
DATABASE_URL=postgresql+asyncpg://receptai_user:receptai@localhost:5432/receptai_db
```

Если такой пользователь и база ещё не созданы:
```bash
psql postgres
CREATE USER receptai_user WITH PASSWORD 'receptai';
CREATE DATABASE receptai_db OWNER receptai_user;
GRANT ALL PRIVILEGES ON DATABASE receptai_db TO receptai_user;
\q
```

## 5. Конфиг бэкенда

Файл `backend/.env` уже есть в репозитории, но проверь:

```bash
cat .env
```

Должно быть так:
```
DATABASE_URL=postgresql+asyncpg://receptai_user:receptai@localhost:5432/receptai_db
SECRET_KEY=<заменить на случайную строку>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
OPENAI_API_KEY=sk-proj-...        ← ВСТАВЬ свой ключ
YOLO_MODEL_PATH=../ml_model/models/fridgify_y11s_full/weights/best.pt
CONFIDENCE_THRESHOLD=0.5
```

## 6. Sanity check — проверить, что окружение в порядке

```bash
cd backend  # должен быть активен venv
python check_setup.py
```

Ожидаемый вывод: `db OK, models OK, ...` и `Exists: True` для пути модели.

## 7. Заполнить БД примерами блюд (15 штук)

```bash
python seed_dishes.py
```

Должно вывести `Seeded dishes: added=15, skipped=0`. Повторный запуск — idempotent.

## 8. Запустить бэкенд

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Сервер слушает на `0.0.0.0:8000` — это нужно, чтобы iPhone мог достучаться по
LAN. Не заменяй на `127.0.0.1` — тогда только сам Mac сможет ходить.

Открой в браузере `http://localhost:8000/docs` — Swagger UI должен показать
все endpoint'ы (`/auth/register`, `/detect-products`, `/dishes/find` и т.д.).

## 9. Узнать LAN IP Mac (для iPhone)

В **новом** окне терминала (бэкенд оставь работать):

```bash
ipconfig getifaddr en0
```

Выведет что-то вроде `192.168.1.55`. Это адрес Mac в твоей WiFi сети.

Тестировать с iPhone:
- На iPhone открой Safari → `http://192.168.1.55:8000` — должно показать
  JSON `{"message": "ReceptAI API is running"}`.
- Если не открывается — проверь firewall на Mac
  (System Settings → Network → Firewall → разрешить Python).

## 10. Фронтенд — установка зависимостей

```bash
cd ../frontend
npm install
```

## 11. Запустить Expo с правильным URL

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.55:8000 npx expo start
```

Замени `192.168.1.55` на свой IP из шага 9.

В терминале появится QR-код.

## 12. Открыть на iPhone

1. Открой **Expo Go** на iPhone
2. Tap **Scan QR Code**
3. Наведи камеру на QR в терминале Mac
4. Приложение откроется в Expo Go

## 13. Сценарий проверки

1. **Регистрация**: Email `test@test.com`, пароль `123456` → нажать «Регистрация»
2. **Главный экран**: «Сделать фото» или «Выбрать из галереи» → выбери
   фото с продуктами (см. `HANDOFF.md` за рекомендациями по типам фото)
3. **Распознавание**: появится список найденных продуктов с %
   уверенности. Лишнее можно удалить крестиком.
4. **«Сформировать рецепты»**: backend подберёт блюда из БД
5. **Tap на блюдо**: OpenAI сгенерирует рецепт (10-30 секунд)
6. **«Начать готовить»**: пошаговый режим. После последнего шага —
   запись в историю.
7. **Tab «История»**: должны появиться приготовленные блюда.

## Возможные проблемы

| Проблема | Решение |
|----------|---------|
| `psycopg2 not found` при `pip install` | requirements использует `asyncpg`, не `psycopg2`. Проигнорируй или см. error log внимательнее |
| `connection refused` от iPhone к Mac | (а) проверь что бэкенд запущен с `--host 0.0.0.0`, (б) проверь файрвол Mac, (в) убедись что iPhone и Mac в одной WiFi |
| Распознавание не находит ничего | Фото слишком далёкое или непривычная сцена. См. рекомендации в `HANDOFF.md` (раздел «Какие фото снимать») |
| OpenAI ошибка | Проверь, что `OPENAI_API_KEY` в `.env` валидный и есть баланс |
| `dishes/find` возвращает `[]` | БД пустая — запусти `python seed_dishes.py` ещё раз |
| Веса не находятся | Проверь, что `best.pt` действительно в `ml_model/models/fridgify_y11s_full/weights/` |
