# Pin Android Functional Requirements

## Local Development

- Node.js and npm
- Android Studio
- Android SDK Platform and Build Tools
- Android emulator or physical Android phone
- Local API running with `npm run api`
- PostgreSQL for the production-ready backend phase

## Functional App Requirements

- Auth: sign up, login, logout, account deletion
- Pins: one active pin per user, 24-hour expiry, categories, unsafe signal, reports
- Memories: camera capture, upload, Feed, Friends, one reaction per memory
- Social: follow/unfollow, mutual-only DMs, notifications
- Streaks: mutual reaction increments streak, streak expires after 5 inactive days
- Safety: report pin/memory/user, block user, moderation queue
- Android permissions: camera, location, media access

## Android Release Requirements

- Stable Android package: `com.pin.app`
- App icon and adaptive icon
- Signed release keystore
- Version code increments for each Play Store upload
- Data safety answers based on actual collected data
- Privacy policy URL
- Support/contact URL
- Community rules page
- Account deletion flow
- Demo/reviewer account

## No Paid Service Constraint

Allowed:

- Google Play Console fee

Avoid:

- Paid maps APIs
- Paid auth services
- Paid analytics
- Paid moderation APIs
- Paid media hosting subscriptions

Use open-source/self-hosted infrastructure for backend, media, moderation, and routing.
