# Yamato

## Project Architecture

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Frontend       | React Native (CLI)                |
| Backend        | Django + Django REST Framework    |
| Database       | PostgreSQL                        |
| Authentication | JWT                               |

## Repository Structure

```
Yamato/
├── frontend/   # React Native CLI app (iOS & Android)
└── backend/    # Django REST Framework API
```

## Getting Started

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # configure your DB credentials
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
# iOS
npx pod-install
npx react-native run-ios
# Android
npx react-native run-android
```
