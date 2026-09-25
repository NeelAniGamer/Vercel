# Shared Infrastructure

All pages across the platform link to a common client foundation located at the root of the repository:

```
Root Shared Files
├── col-auth.js          # Authentication & Cloud Sync
├── col-ui.js            # Global Navigation & Theming
├── col-router.js        # Runtime Status & Banner Routing
├── col-achievements.js  # Global Badge Engine
├── col-ui.css           # Global Design Tokens & Styles
└── config.json          # Supabase Credentials & Feature Flags
```

---

## 1. `col-auth.js` (Authentication & Cloud Sync)

- **Supabase Client**: Initializes `window.supabaseClient` using credentials from `config.json`.
- **OAuth Modal**: Injects the universal login modal (`#loginMo`) supporting Google Sign-In and Magic Link/OTP.
- **Session Management**: Tracks user state via `window.colUser` and dispatches `col:auth-changed` events.
- **Cloud Synchronization**: Handles cloud saves, wallet balances, user achievements, and profile pictures.

---

## 2. `col-ui.js` (Navigation & Visual Shell)

- **Header & Mobile Menu**: Renders the responsive navigation bar and mobile drawer.
- **Custom Cursor**: Handles pointer styling and active hover states.
- **Vercel Speed Insights**: Injects real-time Core Web Vitals telemetry.
- **Device Features**: Triggers subtle haptic feedback (`navigator.vibrate`) on interactive controls.
- **Ambient Graphics**: Manages background aurora gradients.

---

## 3. `col-router.js` (Runtime Routing)

- **Uncached Status Inspection**: Fetches `/config.json` on every page load to evaluate real-time health.
- **Maintenance Enforcement**: Instantly swaps page content to 503 or 404 screens if flagged in config.
- **Broadcast System**: Displays global banner announcements across all pages when enabled.

---

## 4. `config.json` (Runtime Configuration)

```json
{
  "supabaseUrl": "https://hvukxajztizsuhfubjws.supabase.co",
  "supabaseKey": "eyJhbGciOi...",
  "banner": { "active": false, "text": "" },
  "routes": {
    "/home": 200,
    "/Traffic/Driving": 200
  }
}
```
