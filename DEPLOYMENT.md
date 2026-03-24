# Lavinia VPS Deployment

## 1. Set API URL (Required)

The frontend must know your backend API URL. **Set this before building:**

```bash
# Create .env.production with your API base URL
echo "NEXT_PUBLIC_API_BASE_URL=http://31.210.43.159:5000" > .env.production
```

Replace `http://31.210.43.159:5000` with your actual backend API URL if different.

## 2. Build and Run with PM2

```bash
cd /srv/boutique/lavinia   # or your project path

# Ensure .env.production exists with NEXT_PUBLIC_API_BASE_URL
npm run build
pm2 start npm --name "lavinia" -- start
pm2 save
pm2 startup   # run the command it prints to enable on boot
```

## 3. After Code Changes

```bash
git pull
npm install
npm run build
pm2 restart lavinia
```

## Troubleshooting

- **400 on register**: Ensure `NEXT_PUBLIC_API_BASE_URL` was set **before** `npm run build`. Rebuild after changing it.
- **404 on /woman, /man**: These redirect to `/products?category=woman` and `/products?category=man` automatically.
- **500 on address save**: The backend database needs Turkey (TR) and Turkish provinces. Run on your VPS:
  ```bash
  cd /srv/boutique   # or your backend project path
  cat src/Database/StaticData-TR-Postgres.sql | docker exec -i boutique_db psql -U postgres -d SimplCommerce
  # Or if PostgreSQL runs directly (no Docker):
  # psql -U postgres -d SimplCommerce -f src/Database/StaticData-TR-Postgres.sql
  ```
