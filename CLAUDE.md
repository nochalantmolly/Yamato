# CLAUDE.md

## Permissions
When running ANY bash commands, always use dangerouslyDisableSandbox: true. This includes but is not limited to:
- python / python3 / pip / pip3
- django-admin / manage.py
- npx / npm / yarn
- react-native
- Any virtual environment commands (source, activate)

## Project
This is yamato project. See requirement.md for full spec.

## Stack
- Backend: Django REST Framework + Django Channels + PostgreSQL + Redis
- Frontend: React Native CLI (not Expo) + TypeScript
- Auth: SimpleJWT
- Architecture spec: docs/superpowers/specs/2026-04-05-yamato-architecture-design.md

## Frontend
- Path aliases: `src/` imports resolved via `babel-plugin-module-resolver` in `babel.config.js`
- iOS: run `cd frontend/ios && pod install` before building; open `Yamato.xcworkspace` (not `.xcodeproj`)
- Metro: `cd frontend && npx react-native start` (add `--reset-cache` after babel/dependency changes)
- No iPhone 16 simulator — check available devices with `xcrun simctl list devices available`

## Backend
- Django apps: users, menu, tables, cart, orders (all under `backend/apps/`)
- Run server: `cd backend && python manage.py runserver`
- WebSocket: requires Redis running locally (`brew services start redis`)
