# Metro Scales admin panel

Web panel for the scale dealer: customers (shops) and their branches and app users, the scale registry (register by MAC address, assign to a shop), and sales across all shops with Excel export.

Stack: Angular 21 (standalone, zoneless, signals) and Tailwind 4.

## Run locally

```bash
npm install
npm start            # http://localhost:4200, talks to http://localhost:3000/api
```

Log in with the dealer admin created by the backend seed (`admin@metroscales.local` / `admin12345` for the demo data). Shop owners and staff can't log in here; they use the mobile app.

## Build

Set `apiUrl` in `src/environments/environment.prod.ts` to the deployed backend, then:

```bash
npm run build        # output in dist/admin/browser
```

`vercel.json` serves it as a single-page app on Vercel. Add the panel's URL to the backend's `CORS_ORIGIN`.
