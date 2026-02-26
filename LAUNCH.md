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

To push schema and permissions:
```bash
npx instant-cli@latest login
npx instant-cli@latest push schema
npx instant-cli@latest push perms
```
