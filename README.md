# trivsel-tipset

FIFA World Cup 2026 prediction competition site.

## Stack

- **Frontend**: React + Vite ([frontend/](frontend/))
- **Backend**: Azure Functions, Node.js, `@azure/functions` v4 ([api/](api/))
- **Database**: Azure Table Storage (locally via Azurite)
- **Auth**: Magic links → HttpOnly cookie JWT
- **Email**: Azure Communication Services

## Local development

Run these in **three separate terminals**:

```powershell
# 1. Table Storage emulator
npx azurite --silent --location ./azurite-data

# 2. Azure Functions API on http://localhost:7071
cd api
func start

# 3. Vite dev server on http://localhost:5173
cd frontend
npm run dev
```

Open http://localhost:5173. Vite proxies `/api/*` → `localhost:7071` so HttpOnly auth cookies work cross-port.

### First-time setup

```powershell
cd api; npm install
cd ../frontend; npm install
```

Fill in [api/local.settings.json](api/local.settings.json) with:
- `ACS_CONNECTION_STRING` — Azure Communication Services connection
- `ACS_SENDER_EMAIL` — verified sender address
- `ALLOWED_EMAILS` — comma-separated whitelist
- `ADMIN_EMAIL` — admin user

Seed the match data (run once):

```powershell
node scripts/seedMatches.js
```

## Deployment

Production runs on Azure Static Web Apps with a **Linked Backend** to a separate Function App. `/api/*` is routed transparently by SWA.

GitHub Actions secrets required:
- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `AZURE_FUNCTION_APP_PUBLISH_PROFILE`
- `AZURE_FUNCTION_APP_NAME`

Pushes to `main` (and `feature/claude-design`) trigger deploy via [.github/workflows/](.github/workflows/).
