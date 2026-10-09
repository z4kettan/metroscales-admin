# Metro Scales admin panel

Web panel for the scale dealer: customers (shops) with their branches and app logins, the scale registry (register by MAC address, assign to a branch), and sales across all shops with Excel export.

Stack: Angular 21 (standalone, zoneless, signals), Tailwind 4, Angular service worker.

## Look and feel

- Material 3, matching the Flutter app: colours from the same teal seed (`#0F766E`) with an indigo tertiary, Plus Jakarta Sans, Material Symbols Rounded. The colour roles are CSS variables in `src/styles.css`, with a dark set under `[data-theme=dark]`.
- Light, dark or follow the device: account menu → Theme (`core/theme.service.ts`).
- Phones get a top app bar, a bottom navigation bar, a floating action button and bottom sheets for forms. Tablets get a navigation rail and desktops a navigation drawer (`layout/shell.component.ts`).
- Shared pieces in `src/app/shared`: modal (dialog / bottom sheet), page header, FAB, empty state, stat card, snackbars, confirm dialog, credentials dialog, scale dialog.

## Logins

The dealer creates a username and password for every shop user (customers → a customer → Logins). After creating a login or resetting a password, the panel shows the details once with Copy and Share buttons. Shop owners and staff use them in the mobile app; they can't sign in here.

## Installable app (PWA)

`public/manifest.webmanifest`, icons in `public/icons`, and `ngsw-config.json` (production builds only). Chrome / Edge / Android show "Install app" in the account menu and on the login page; on iPhone the same menu explains Share → Add to Home Screen. A snackbar offers a reload when a new version is deployed.

## Run locally

```bash
npm install
npm start            # http://localhost:4200, talks to http://localhost:3000/api
```

Sign in with the dealer admin from the backend seed: username `admin`, password `admin12345` for the demo data.

## Build and host

Set `apiUrl` in `src/environments/environment.prod.ts` to the deployed backend, then:

```bash
npm run build        # output in dist/admin/browser
```

On Vercel: Add New → Project → import this repo. `vercel.json` sets the build, the SPA routing and the service worker cache headers, so no other settings are needed. Add the panel's URL to the backend's `CORS_ORIGIN`.
