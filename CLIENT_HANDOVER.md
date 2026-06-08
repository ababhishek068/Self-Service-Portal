# Client Handover Setup

This package contains the Self-Service Portal frontend, Node backend, and Prisma/MySQL database layer.

## 1. Requirements

- Node.js 20 or newer
- MySQL-compatible database, for example MySQL or TiDB Cloud
- Database connection string

## 2. Install Dependencies

Run from the project root:

```bash
npm install
npm --prefix db install
npm --prefix server install
npm --prefix self-service-portal install
```

## 3. Configure Environment Files

Create these files from the provided examples:

```bash
cp db/.env.example db/.env
cp server/.env.example server/.env
cp self-service-portal/.env.example self-service-portal/.env.local
```

Set the same database URL in both `db/.env` and `server/.env`.

Example for TiDB Cloud:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:4000/test?sslaccept=strict"
```

Example for local MySQL:

```env
DATABASE_URL="mysql://ssp:ssp_password@localhost:3306/ssp_portal"
```

In `server/.env`, also check:

```env
PORT=4000
AUTH_PROVIDER=local
USER_STORE=db
JWT_SECRET=replace-with-a-long-random-secret
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
```

In `self-service-portal/.env.local`, check:

```env
VITE_USE_MOCK=false
VITE_AUTH_API_URL=http://localhost:4000
```

## 4. Prepare Database

For a new empty database:

```bash
npm --prefix db run generate
npm --prefix db run migrate:deploy
npm --prefix db run seed
```

For an existing database, review migrations before applying them.

DataGrip inspection SQL is available at:

```text
db/sql/datagrip_mysql_check.sql
```

## 5. Run Locally

Start backend:

```bash
npm --prefix server run dev
```

Start frontend in a second terminal:

```bash
npm --prefix self-service-portal run dev
```

Open:

```text
http://localhost:5173
```

Demo login after seed:

```text
Staff No: EMP-02418
Password: Password@123
```

## 6. Production Build

```bash
npm --prefix server run build
npm --prefix self-service-portal run build
npm --prefix server run start
```

Serve `self-service-portal/dist` using a static web server or hosting platform, and set `VITE_AUTH_API_URL` to the deployed backend URL before building.

