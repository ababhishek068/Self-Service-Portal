# ESS parity implementation

The React portal uses one API contract for both login methods:

- Application User selects the database backend on port 4001.
- BC365 User selects the Business Central adapter on port 4000.
- Both users see the same React routes and workflow screens.

## Implemented ESS workflows

- Leave request and downloadable leave statement PDF
- Training request
- Salary advance using `FnSalaryAdvanceHeader`
- Downloadable payslip PDF
- Imprest and imprest surrender
- Staff claims
- Petty cash request
- Petty cash replenishment using the ESS Inter-Bank Transfer workflow
- Purchase and store requisitions
- Transport and fuel requisitions
- Work tickets
- Transfer orders
- Gate passes generated from BC Store Issue documents
- Pending, approved, and rejected approval queues
- Department staff and staff-on-leave views
- HR document downloads
- Employee profile, employee attachments, and password change

Document Requisition and Vehicle Transfer remain marked as under construction,
matching the latest ESS portal. Overtime, Travel, and standalone Maintenance are
not shown in navigation because the latest ESS does not expose complete
dedicated workflows for them.

## Attachments

Allowed files: PDF, DOC, DOCX, JPEG, JPG, and PNG.

- Maximum per file: 10 MB
- Maximum combined request payload: 20 MB
- Application User files are stored in `portal_attachments`.
- BC365 User files use `UploadDocumentAttachment`,
  `GetDocumentAttachment`, and `DeleteDocumentAttachment`.
- File bytes are not returned in request list or detail JSON.

Apply the new database migration before starting the application backend:

```powershell
cd C:\SelfServiceSuite\SelfServicePortal\db
npm run generate
npm run migrate:deploy
```

## Production build

```powershell
cd C:\SelfServiceSuite\SelfServicePortal
npm run build:all
```

The production React build is copied into `SelfServiceBackend\public` and is
served from:

```text
http://HOST-IP:4000
```

Set the application backend CORS origin to that exact public URL:

```env
CORS_ORIGINS=http://HOST-IP:4000
```

## Client-network BC checks

Run these on the Windows host before testing BC365 User:

```powershell
Resolve-DnsName erp-app-uat
Test-NetConnection erp-app-uat -Port 2447
Test-NetConnection erp-app-uat -Port 2448
```

The portal and Application User workflows can run without internet. BC365 User
still requires the host machine to resolve and reach the internal BC server.

## Validation endpoints

```powershell
Invoke-RestMethod http://localhost:4000/api/health
Invoke-RestMethod http://localhost:4001/api/health
```

Business Central request evidence remains in:

```text
SelfServiceBackend\bc-integration.log
```
