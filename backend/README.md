# Puzzle Backend

Minimal backend for:

- `POST /api/auth/google`
- `GET /api/progress`
- `PUT /api/progress`

## Quick Start

1. Copy env file:

   `cp .env.example .env`

2. Fill `.env` values:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `CORS_ORIGIN`

3. Install and run:

   - `npm install`
   - `npm run dev`

4. Health check:

   - `GET http://localhost:5501/api/health`

## Frontend Integration

The puzzle frontend reads:

- `window.PUZZLE_API_BASE` (optional)

If your backend is `http://localhost:5501`, add this before `state.js`:

```html
<script>window.PUZZLE_API_BASE = "http://localhost:5501";</script>
```

## Notes

- Google OAuth verification uses `google-auth-library` and ID token verification.
- Progress only moves forward (`max` merge strategy).
