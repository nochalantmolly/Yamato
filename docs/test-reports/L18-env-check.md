# L18 Environment Health Check — molly

**Date:** 2026-05-24
**Server:** occachildcare
**Service:** molly-django
**App URL:** https://molly-app.occachildcare.ca
**Backend path on server:** /home/molly/project/backend

## Check 1 — systemd service
**Status:** PASS (active)
```
active
```

## Check 2 — Admin URL over HTTPS
**Status:** PASS (HTTP 200)
**HTTP code:** 200

## Check 3 — API URL over HTTPS
**Status:** PASS (HTTP 404)
**HTTP code:** 404

## Verdict
**READY for L18** — Service is active, admin and API endpoints are responding over HTTPS.
