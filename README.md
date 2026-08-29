# umakov.com — новый сайт

Магазин UMAKOV Germany: заборы, ворота, перила, перегородки, навесы.
Переезд с Shopify (umakovshop.com) на собственный стек.

## Стек

| Часть | Технология | Папка |
|---|---|---|
| Витрина (фронтенд) | Next.js 16 + Tailwind 4 | `storefront/` |
| Бэкенд + админка | Medusa 2.x | `backend/` (приложение в `backend/apps/backend/`) |
| База данных | PostgreSQL 16 | локально: портативный в `.pg/` (не в git) |
| Кэш/очереди (прод) | Redis | `docker-compose.yml` (для сервера) |

## Запуск для разработки

Нужны три процесса (каждый в своём терминале):

```powershell
# 1. База данных (после перезагрузки ПК запускать заново)
b:\umakov-new\.pg\pgsql\bin\pg_ctl.exe -D b:\umakov-new\.pg\data -l b:\umakov-new\.pg\pg.log start

# 2. Бэкенд Medusa — API на :9000, админка на http://localhost:9000/app
cd b:\umakov-new\backend\apps\backend
npm run dev

# 3. Витрина — http://localhost:3000
cd b:\umakov-new\storefront
npm run dev
```

Админка Medusa: http://localhost:9000/app — логин `admin@umakov.de`
(пароль задан при создании пользователя; смените его в админке).

## Импорт каталога со старого сайта

Выгрузка Shopify лежит в `assets/` (фото — только локально, в git лишь
метаданные `assets/_meta/catalog.json`). Импорт в Medusa:

```powershell
cd b:\umakov-new\backend\apps\backend
npx medusa exec ./src/scripts/import-catalog.ts
```

Скрипт идемпотентный: уже импортированные товары пропускает, ошибки
пишет в `import-errors.json`. Категории строятся из иерархии Shopify
`type`. Картинки товаров пока указывают на CDN Shopify — до отключения
старого сайта их нужно перелить в своё хранилище (S3/R2).

## Docker

`docker-compose.yml` (Postgres + Redis) предназначен для сервера и для
локальной работы через Docker Desktop. На этой машине Docker Desktop
не работает, потому что не установлен WSL. Чтобы починить, в PowerShell
**от администратора**:

```powershell
wsl --install --no-distribution
# затем перезагрузить компьютер и запустить Docker Desktop
```

После этого можно перейти с портативного Postgres на контейнерный
(`docker compose up -d`), база переносится обычным dump/restore.

## Структура

```
assets/                  выгрузка Shopify (фото + _meta/catalog.json)
site-photo-assets-webp/  фото для дизайна главной
storefront/              витрина Next.js
backend/                 Medusa (монорепа; приложение в apps/backend)
docker-compose.yml       Postgres + Redis для сервера
```
