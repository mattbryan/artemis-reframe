# Launch Commands

**Before deploying:** see **[HANDOFF.md](./HANDOFF.md)** for env, uploads, InstantDB, and design intent.

## Frontend (Next.js)

**Development**
```bash
npm run dev
```

**Production**
```bash
npm run build
npm run start
```

---

## Backend (InstantDB)

Artemis Reframe uses **InstantDB** as the database — a hosted, real-time service. There is no local backend server to run.

Ensure `.env.local` contains:
```
NEXT_PUBLIC_INSTANT_APP_ID=badba338-b7b9-48d0-b1cb-0e577c317843
```

To push schema and permissions (required for generation to work):
```bash
npx instant-cli@latest login
npx instant-cli@latest push schema
npx instant-cli@latest push perms
```
Run these from your machine so the browser login flow works. Generation needs the `project` and `projectOutput` entities and the `projectOutputs` link; if they’re missing, the progress bar will stay stuck and no outputs will appear.

**Auth (Google OAuth):** To enable sign-in:
1. In the [InstantDB dashboard](https://instantdb.com/dashboard) → your app → **Auth**, add **Google** as an OAuth provider (Client ID and Client Secret from Google Cloud Console).
2. In the same **Auth** tab, under **Redirect Origins**, add the exact URL where the app runs. For local dev this must match your dev server port, e.g. `http://localhost:3000` or `http://localhost:3001`. A 400 on `/runtime/oauth/start` usually means this origin is missing or the port doesn’t match.
3. In [Google Cloud Console](https://console.cloud.google.com/), create OAuth 2.0 credentials and add `https://api.instantdb.com/runtime/oauth/callback` as an Authorized redirect URI.
4. No new env vars are required. The login page uses `db.auth.createAuthorizationURL({ clientName: "google", redirectURL })`; the client name must match the name you gave the Google client in the InstantDB dashboard (e.g. `"google"`).

**Schema checklist (after push schema):** In the [InstantDB dashboard](https://instantdb.com/dashboard) → your app → Schema, confirm you have:
- Entity **project** (with `createdAt`, `updatedAt`, `generationLog`, `createdByEmail`, `createdByName`, etc.)
- Entity **projectOutput** (with `projectId`, `targetType`, `briefId`, `status`, `contentJson`, `createdAt`, `updatedAt`)
- Link **projectOutputs** (project → projectOutput, one-to-many)

**If `push schema` or `push perms` fails** with `Malformed parameter: ["headers" "authorization"]`:
1. **Use the admin token instead of browser login.** From the [Instant CLI docs](https://www.instantdb.com/docs/platform-api), you can pass your app’s admin token so the CLI doesn’t use the broken auth path. Ensure `INSTANT_APP_ADMIN_TOKEN` is in `.env.local`, then run:
   ```bash
   npx instant-cli@latest push schema --token "$(grep INSTANT_APP_ADMIN_TOKEN .env.local | cut -d= -f2)"
   npx instant-cli@latest push perms --token "$(grep INSTANT_APP_ADMIN_TOKEN .env.local | cut -d= -f2)"
   ```
   Or export the token and run: `export INSTANT_APP_ADMIN_TOKEN="your_token"` then `npx instant-cli@latest push schema --token $INSTANT_APP_ADMIN_TOKEN` (and same for `push perms`).
2. **Or re-auth with login:** Run `npx instant-cli@latest login` and complete the browser flow, then retry (sometimes fixes the quirk).
3. **Or use a CLI auth token for CI:** Run `npx instant-cli@latest login -p` to print a token, set `INSTANT_CLI_AUTH_TOKEN` in your environment, then run `push schema` / `push perms` again.

To kill port
```
kill -9 $(lsof -t -i :3000)
```