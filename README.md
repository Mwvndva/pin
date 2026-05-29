# Pin

Pin is a social map app for discovering nearby social pins, seeing event memories, reacting to mutuals, and building mutual vibe streaks.

## Current Build Stage

This repository now contains:

- The original HTML/CSS prototype: `index.html`, `styles.css`
- A new Expo/React Native mobile app foundation
- Static MVP screens for Pins, Memories, Settings, create-pin flow, mutual DMs, notifications, and vibe streaks
- A local Node.js API scaffold under `server/` with seed data and Android-ready endpoints
- PostgreSQL schema draft: `server/schema.sql`

## No-Paid-Service Constraint

The app is planned to avoid paid third-party subscriptions and paid APIs, except:

- Apple Developer Program fee
- Google Play Console fee

Recommended production architecture:

- Mobile app: React Native + Expo
- Backend: Node.js/Express or NestJS
- Database: PostgreSQL
- Media storage: self-hosted MinIO
- Maps: OpenStreetMap-based tiles/routing, self-hosted where needed
- Push notifications: APNs and Firebase Cloud Messaging
- Moderation: in-house report queue and admin dashboard

## Android-First Local Run

Install dependencies:

```bash
npm install
```

Start the local API:

```bash
npm run api
```

In another terminal, start the Android app:

```bash
npm run android
```

For an Android emulator, the app uses:

```text
http://10.0.2.2:3101
```

For web/local preview, set:

```powershell
$env:EXPO_PUBLIC_API_URL='http://127.0.0.1:3101'
```

## Android Build Commands

Prebuild Android native project:

```bash
npm run android:prebuild
```

Install/run on device or emulator:

```bash
npm run android:device
```

Create a debug APK after Android Studio/SDK is configured:

```bash
npm run android:apk:debug
```

Create a release AAB after signing is configured:

```bash
npm run android:aab:release
```

## Store-Critical Features To Build Before Submission

- Account deletion
- Report pin, report memory, report user
- Block user
- Published community rules
- Privacy policy and support URL
- Reviewer demo account
- Location/camera permission explanations
- UGC moderation queue

## Local API Contract

Current implemented local endpoints:

- `GET /health`
- `GET /api/bootstrap`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/pins`
- `POST /api/pins/:id/pull-up`
- `POST /api/memories`
- `POST /api/memories/:id/reactions`
- `POST /api/users/:id/follow`
- `POST /api/reports`
- `POST /api/blocks`
- `POST /api/dms`
- `GET /api/admin/reports`
- `DELETE /api/account`
