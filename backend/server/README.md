# Pin Local API

This is the Android-first local backend scaffold.

## Run

```bash
npm run api
```

The API listens on:

```text
http://localhost:3101
```

Android emulator access:

```text
http://10.0.2.2:3101
```

## Current Storage

The current implementation uses in-memory seed data so Android integration can start immediately. The endpoint shapes are intentionally close to the planned PostgreSQL-backed API.

## PostgreSQL Handoff

Replace the in-memory `db` object with PostgreSQL tables for:

- users
- sessions
- follows
- pins
- memories
- reactions
- pull_ups
- reports
- blocks
- notifications
- dms
- streaks

Keep the route behavior stable so the mobile app does not need rewrites.

Use `backend/server/schema.sql` as the first local schema draft.
