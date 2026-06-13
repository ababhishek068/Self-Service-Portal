# Hosting All Self-Service Projects on One Windows Host

## Audited architecture

The repository contains two different backend systems:

| Component | Production role | Port |
| --- | --- | --- |
| `self-service-portal` | React user interface | Served by port 4000 |
| `SelfServiceBackend` | Real Business Central OData/SOAP integration | 4000 |
| `server` | Application User API using local portal records | 4001 |
| `db` | Prisma database package used by `server` | MySQL on 3306 |

Users open one portal address:

```text
http://HOST-IP:4000
```

The sign-in selection determines the backend:

```text
Application User -> http://HOST-IP:4001 -> server -> local MySQL
BC365 User       -> http://HOST-IP:4000 -> SelfServiceBackend -> Business Central
AD User          -> not implemented
```

MySQL port `3306` must remain private to the host PC.

## 1. Prepare the host PC

Ask client IT for:

- a Windows PC/server that remains powered on;
- a static IP or DHCP reservation, for example `192.168.1.50`;
- permission to open TCP ports `4000` and `4001` to the local subnet;
- internal DNS access to `erp-app-uat`;
- a Windows account allowed to install a scheduled task.

Disable sleep and hibernation on the host.

## 2. Install software

Install on the Windows host:

1. Node.js LTS x64.
2. MySQL Server 8.x, configured as an automatic Windows service.
3. `curl.exe` must be available. Current Windows versions normally include it.

For an offline client site, download the Node.js and MySQL offline installers
on another approved computer and transfer them to the host.

Verify:

```powershell
node --version
npm --version
mysql --version
curl.exe --version
```

## 3. Use the required directory layout

Copy the projects to:

```text
C:\SelfServiceSuite\
├── SelfServicePortal\
│   ├── self-service-portal\
│   ├── server\
│   ├── db\
│   └── deploy\
└── SelfServiceBackend\
```

Do not copy `node_modules` from macOS. Dependencies containing Prisma binaries
must be installed or prepared on Windows.

If the host has no internet, run all `npm ci` and build commands on another
Windows x64 PC, then transfer the complete directories, including their
Windows-generated `node_modules`, `dist`, and `public` directories.

## 4. Install dependencies on the Windows preparation PC

```powershell
Set-Location C:\SelfServiceSuite\SelfServicePortal\db
npm ci

Set-Location C:\SelfServiceSuite\SelfServicePortal\server
npm ci

Set-Location C:\SelfServiceSuite\SelfServicePortal\self-service-portal
npm ci

Set-Location C:\SelfServiceSuite\SelfServiceBackend
npm ci
```

After these commands, transfer the complete `C:\SelfServiceSuite` directory to
the offline host if necessary.

## 5. Configure local MySQL

Open MySQL as an administrator:

```powershell
mysql -u root -p
```

Create a local-only application account:

```sql
CREATE DATABASE ssp_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'ssp'@'localhost'
  IDENTIFIED BY 'REPLACE_WITH_A_STRONG_PASSWORD';

GRANT ALL PRIVILEGES ON ssp_portal.* TO 'ssp'@'localhost';
FLUSH PRIVILEGES;
```

Use the same URL in both configuration files:

```env
DATABASE_URL="mysql://ssp:REPLACE_WITH_URL_ENCODED_PASSWORD@127.0.0.1:3306/ssp_portal"
```

If the password contains characters such as `@`, `:`, `/`, `#`, or `%`, URL
encode it before placing it in `DATABASE_URL`.

## 6. Configure `db`

```powershell
Set-Location C:\SelfServiceSuite\SelfServicePortal\db
Copy-Item .env.example .env
notepad .env
```

Set the local `DATABASE_URL`.

Apply production migrations:

```powershell
npm run generate
npm run migrate:deploy
```

For the supplied offline package, where no Windows npm installation step is
available, execute `deploy\windows\create-database.sql.example` as MySQL root
after replacing its password, then run:

```powershell
.\deploy\windows\initialize-schema.bat
```

Do not run `npm run seed` in production unless this is a UAT/demo environment.
Create real Application User accounts using:

```powershell
npm run create-user -- --staffNo EMP-00123 --name "Jane Doe" --password "TemporaryPassword123" --department FIN
```

In the offline package, the equivalent direct command is:

```powershell
node scripts\createUser.js --staffNo EMP-00123 --name "Jane Doe" --password "TemporaryPassword123" --department FIN
```

## 7. Configure `server`

```powershell
Set-Location C:\SelfServiceSuite\SelfServicePortal\server
Copy-Item ..\deploy\windows\server.env.example .env
notepad .env
```

Required values:

```env
NODE_ENV=production
PORT=4001
AUTH_PROVIDER=local
USER_STORE=db
DATABASE_URL="mysql://ssp:PASSWORD@127.0.0.1:3306/ssp_portal"
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
CORS_ORIGINS=http://192.168.1.50:4000
```

The `server` Business Central provider is a stub. Keep `AUTH_PROVIDER=local`.

## 8. Configure `SelfServiceBackend`

```powershell
Set-Location C:\SelfServiceSuite\SelfServiceBackend
Copy-Item .\deploy\windows\host.env.example .env
notepad .env
```

Set:

```env
HOST=0.0.0.0
PORT=4000
PORTAL_STATIC_DIR=public
CORS_ORIGIN=http://192.168.1.50:4000
```

Also set the real:

- `BC_DOMAIN`
- `BC_NAV_USER`
- `BC_NAV_PASSWORD`
- `SESSION_SECRET`
- `JWT_SECRET`

Verify BC from the host:

```powershell
Resolve-DnsName erp-app-uat
Test-NetConnection erp-app-uat -Port 2447
Test-NetConnection erp-app-uat -Port 2448
```

Both port tests must report `TcpTestSucceeded : True`.

## 9. Build all four components

Run from the portal root:

```powershell
Set-Location C:\SelfServiceSuite\SelfServicePortal
npm run build:all
```

This command:

1. generates the Prisma client;
2. builds `server`;
3. builds `SelfServiceBackend`;
4. builds the React on-prem frontend;
5. copies React into `SelfServiceBackend\public`.

Expected files:

```text
SelfServicePortal\server\dist\index.js
SelfServiceBackend\dist\server.js
SelfServiceBackend\public\index.html
```

## 10. Open firewall ports

Open Administrator PowerShell:

```powershell
Set-Location C:\SelfServiceSuite\SelfServicePortal
powershell -ExecutionPolicy Bypass -File .\deploy\windows\open-suite-firewall.ps1
```

Do not create an inbound firewall rule for MySQL port `3306`.

## 11. Start everything

```powershell
Set-Location C:\SelfServiceSuite\SelfServicePortal
.\deploy\windows\start-suite.bat
```

The script starts:

- application API on `4001`;
- BC API and React portal on `4000`.

MySQL should already be running as an automatic Windows service.

## 12. Test on the host

```powershell
Invoke-RestMethod http://localhost:4000/api/health
Invoke-RestMethod http://localhost:4001/api/health
Test-NetConnection 127.0.0.1 -Port 3306
```

Open:

```text
http://localhost:4000
```

Test both:

- **Application User** using an account created in local MySQL.
- **BC365 User** using a valid BC portal account.

Do not select AD because it is not implemented.

## 13. Test from another PC

```powershell
Test-NetConnection 192.168.1.50 -Port 4000
Test-NetConnection 192.168.1.50 -Port 4001
```

Open:

```text
http://192.168.1.50:4000
```

No application installation or script is required on client PCs.

## 14. Review logs

```powershell
Get-Content C:\SelfServiceSuite\SelfServiceBackend\bc-integration.log -Wait
Get-Content C:\SelfServiceSuite\SelfServiceBackend\logs\bc-api.log -Wait
Get-Content C:\SelfServiceSuite\SelfServicePortal\server\logs\application-api.log -Wait
```

Successful BC activity should show:

```text
[bc-request]
[bc-response] status=200
```

## 15. Enable automatic startup

After manual testing succeeds, use Administrator PowerShell:

```powershell
Set-Location C:\SelfServiceSuite\SelfServicePortal
powershell -ExecutionPolicy Bypass -File .\deploy\windows\install-suite-startup.ps1
```

Restart Windows and repeat the client-PC tests.

## 16. Stop the Node services

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\windows\stop-suite.ps1
```

## Production cautions

- Keep ports `4000` and `4001` limited to the client LAN.
- Keep MySQL bound locally and do not expose `3306`.
- Rotate credentials previously visible in recordings or source files.
- Back up MySQL regularly.
- Back up `.env` files securely.
- Use internal DNS and HTTPS before using the portal over a shared or
  untrusted network.
