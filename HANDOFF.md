# HANDOFF — состояние проекта на момент переезда на Mac

Дата: 2026-05-01
Платформа разработки: Windows (i7-8700K + RTX 2070 SUPER 8GB) → переезжаем на macOS.

---

## TL;DR

- ✅ YOLO11s обучен (300 эпох, mAP50-95 = 0.886 на test split, файл `best.pt` 19 МБ)
- ✅ OOD-evaluation проведён на стороннем датасете (mAP50-95 = 0.328 на Smart-Fridge — в 2.7× ниже, что ожидаемо для distribution shift)
- ✅ Frontend↔Backend wiring починен — все 6 экранов используют реальные API-вызовы (раньше было mock)
- ✅ Бэкенд проверен на импорты, все эндпоинты регистрируются корректно
- ✅ seed-скрипт создаёт 15 примеров блюд для демо
- ✅ Документация: `SETUP.md` (инструкции запуска)
- ⏳ Перенос на Mac, тестирование на iPhone через Expo Go
- ⏳ Запись экрана работы приложения для ВКР

---

## Что сделано на этом этапе разработки

### ML — обучение модели

- **Датасет**: Roboflow Fridgify v4 (workspace01-ae0oa/fridgify), 14k картинок 320×320, 58 классов
- **Тренировка**: YOLOv11s, 300 эпох, batch=16, imgsz=640, optimizer=SGD, cos_lr, full augmentation pipeline (mosaic + mixup + copy_paste), close_mosaic=15
- **Время**: 14.97 часов на RTX 2070 SUPER (workers=4 после увеличения page file до 48 GB)
- **Финальные метрики**:
  - Test mAP50: **0.986**
  - Test mAP50-95: **0.886**
  - Per-class: 50+ классов выше 0.85 mAP50, проблемные — `chillies` (0.64) из-за коллизии с `green chilies`
- **Артефакты**: `ml_model/models/fridgify_y11s_full/`
  - `weights/best.pt` (19.3 МБ) — финальные веса (gitignored, лежит в GitHub Release)
  - `weights/last.pt`, `epoch{0,10,...,290}.pt` — чекпоинты
  - `results.png`, `confusion_matrix.png`, `BoxPR_curve.png` и др. — графики
  - `results.csv` — все per-epoch метрики

### ML — OOD анализ

- Скачан сторонний датасет `fridge-detection/smart-fridge-2uqsi v2` через Roboflow API (300 картинок, 26 пересекающихся классов смаппено к нашим 58)
- Запущен `model.val()` на этом OOD-сете
- Результат: **mAP50-95 = 0.328** (в 2.7× ниже in-distribution)
- Главная проблема — **низкий recall (0.38)**: модель «молчит» на 62% реальных объектов
- Полный отчёт: `ml_model/models/fridgify_y11s_full/ood_eval/REPORT.md`

### Backend — что починено

- `backend/.env`: исправлен путь `YOLO_MODEL_PATH` на `../ml_model/models/fridgify_y11s_full/weights/best.pt` (раньше указывал на несуществующий файл)
- `.env.example` обновлён аналогично
- Создан `backend/seed_dishes.py` — заполняет таблицу `dishes` 15 примерами рецептов
- Создан `backend/check_setup.py` — sanity-check скрипт для проверки окружения

### Frontend — что починено (большие изменения)

| Файл | Что было | Что стало |
|------|----------|-----------|
| `src/services/api.ts` | hardcoded URL, нет типов, экспорт `productsAPI`/`dishesAPI`/`historyAPI` | env-based URL (`EXPO_PUBLIC_API_URL`), полные TypeScript интерфейсы из backend schemas |
| `src/screens/HomeScreen.tsx` | `setTimeout(1500)` вместо API-вызова | Просто `navigation.navigate('RecognizedProducts', { imageUri })`, детекция в следующем экране |
| `src/screens/RecognizedProductsScreen.tsx` | `import { api }` (не существует), shape `{id, name, confidence}` ожидался | `import { productsAPI, DetectedProduct }`, реальный shape `{name, confidence}`, генерация key локально |
| `src/screens/RecipeListScreen.tsx` | `import { api }` (не существует), вызов `api.generateRecipes` | `import { dishesAPI, DishOut }`, вызов `dishesAPI.find(products)`, рендер `DishOut[]` |
| `src/screens/RecipeDetailScreen.tsx` | hardcoded `instructions` array (заглушка) | Реальный вызов `dishesAPI.generateRecipe(title, ingredients)` → OpenAI gpt-4o-mini |
| `src/screens/HistoryScreen.tsx` | hardcoded `HISTORY_DATA` | Реальный вызов `historyAPI.getAll()` с pull-to-refresh и `useFocusEffect` |
| `src/screens/ProfileScreen.tsx` | обращался к `user.name` (нет в схеме) | Использует только `user.email` |
| `src/screens/CookingModeScreen.tsx` | По окончанию готовки просто переходил на History | Вызывает `historyAPI.create(dishId)` для записи в БД |
| `src/navigation/AppNavigator.tsx` | Тип `RecipeDetail.recipe: any` | Типизирован: `{ dish: DishOut; userIngredients: string[] }`, `CookingMode` теперь требует `dishId: number` |

---

## Что ещё НЕ сделано — следующие шаги

### Обязательно (для защиты ВКР)

1. **Перенести на Mac** — git pull + скачать `best.pt` из GitHub Release
2. **Поставить зависимости** на Mac (см. `SETUP.md` шаг 3-7)
3. **Запустить бэкенд + Expo + iPhone** (см. `SETUP.md` шаг 8-12)
4. **Снять видео работы приложения** для презентации ВКР

### Желательно (но опционально)

- **Запись экрана**: 5-10 фото-демонстраций. Рекомендации какие фото снимать — ниже.
- Замер реальной latency на Mac (M-series GPU vs CPU) — добавить в защитную речь

### Future work (после защиты)

- Дообучение на смешанном датасете (fridgify + smart-fridge + свои фото)
- Класс-консолидация: `chillies` + `green chilies` → один; `peppers` + `bell pepper` → один
- Усиленные аугментации (`albumentations`: watermark overlay, perspective, lighting)
- Возможно YOLOv11l/x для лучшей OOD-генерализации
- Alembic миграции (сейчас `Base.metadata.create_all` на старте)
- Class-based confidence threshold (для редких классов снижать порог)

---

## Какие фото снимать для записи экрана защиты ВКР

### ✅ Что точно сработает (используй эти типы)

Модель обучена на phone-фото с близкого расстояния. Идеальный кадр:
- 5-10 продуктов одновременно
- Верхний или 45° ракурс
- Однотонный фон (стол, полка холодильника)
- Бытовое освещение

**Сценарий 1 — «полный холодильник»**:
Открыть холодильник, выложить на стол: помидор, огурец, морковь, лук, сыр, яйца. Снять сверху. Все эти классы у нас в топе по mAP.

**Сценарий 2 — «пакет с покупками»**:
Достать из пакета: банан, яблоко, апельсин, лимон, картошка. Эти классы — тоже отличный mAP (apple 0.99, banana 1.0, orange 1.0, potato 0.99).

**Сценарий 3 — «полка холодильника»**:
Просто фото полки с 4-6 продуктами. Прямой случай использования.

### ❌ Чего избегать

- Стоковые фото с водяными знаками (как PIXEL-SHOT — провал)
- Очень широкие сцены (вся кухня)
- Один объект крупным планом
- Странные ракурсы
- Полупрозрачные упаковки/бутылки
- Редкие классы (`shallot`, `mango`, `dates`, `swiss butter`)

### Лайфхак — проверка фото перед демо

Перед записью экрана прогони фото через `ml_model/scripts/predict.py`:

```bash
python ml_model/scripts/predict.py /path/to/photo.jpg
```

Если в выводе **>=5 классов с confidence >0.5** — годится для демо.
Если меньше — переснять.

---

## Известные ограничения модели (для секции "Limitations" в ВКР)

1. **Distribution shift**: Test mAP 0.886 vs OOD 0.328 (см. ood_eval/REPORT.md). Модель отлично работает на phone-фото в стиле Roboflow Fridgify, но проседает на других стилях (стоковые, студийные).
2. **Recall < Precision на OOD**: Модель консервативна — пропускает 62% объектов вне распределения, но точна когда находит.
3. **Редкие классы провалены**: dates, shallot, red grapes, swiss butter, swiss jam, swiss yoghurt, mango, spring onion (<50 примеров в train) — модель их почти не видит.
4. **Class collisions**: chillies vs green chilies (mAP 0.64 vs 0.88) — путаются. peppers vs bell pepper аналогично.
5. **Low resolution training data**: Все train-картинки 320×320, что ограничивает детекцию мелких объектов в высокоразрешающих фото с iPhone (там объекты могут оказаться пропорционально меньше).

---

## Файлы, которые нужно НЕ потерять при переезде

Через git `push/pull` уйдёт всё кроме:

| Файл/папка | Размер | Где хранить |
|------------|--------|-------------|
| `ml_model/models/fridgify_y11s_full/weights/best.pt` | 19 МБ | **GitHub Release v0.1.0** |
| `backend/.env` | ~500 байт | Создать вручную на Mac (есть `.env.example`) |
| `D:\fridgify_train\` (датасет) | 4 ГБ | Не нужен на Mac (только для retrain) |
| `D:\eval_smart_fridge\` (OOD данные) | ~500 МБ | Не нужен на Mac |
| `.venv-win/` | ~3 ГБ | Не нужен на Mac (создашь свой `venv/`) |
