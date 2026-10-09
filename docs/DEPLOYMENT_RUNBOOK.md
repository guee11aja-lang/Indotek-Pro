# INDOTEK PRO — PRODUCTION DEPLOYMENT RUNBOOK & OPERATIONAL GUIDE

## 1. Production Architecture Overview
Indotek Pro is a high-reliability Construction Management SaaS designed for multi-project contract tracking, earned-value financial control (RAB/BOQ), inventory/warehouse logistics, procurement approval workflows, and immutable audit governance.

- **Frontend**: Vite 8 + React 19 + TypeScript + Tailwind CSS (SPA)
- **Database & Auth**: Google Cloud Firestore (Multi-tenant document store) + Firebase Authentication
- **Security**: Firestore Rules (Role-based access control, WORM audit trails, state machine guards)
- **Deployment Target**: Firebase Hosting & Google Cloud Run

---

## 2. Environment Configuration

### Required Production Environment Variables
| Variable | Description | Managed By |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-side Gemini API key for AI Studio integrations | Injected via Secret Manager |
| `APP_URL` | Canonical origin URL of the hosted application | Injected by Cloud Run runtime |
| `FIREBASE_PROJECT_ID` | GCP Project ID hosting Firestore (`careful-filament-dlxdt`) | `firebase-applet-config.json` |
| `FIRESTORE_DATABASE_ID` | Custom Firestore database instance ID | `firebase-applet-config.json` |

### Environment Separation
- **Development**: Local Vite dev server (`http://localhost:3000`), offline-capable mock state fallback with realistic civil construction fixtures.
- **Production**: Optimized static distribution (`dist/`), Firestore real-time synchronization, Firebase Authentication with session enforcement, and immutable append-only audit stream.

---

## 3. Deployment Procedure

### Step 1: Pre-Deployment Verification
```bash
# 1. Verify TypeScript types and code linting
npm run lint

# 2. Execute full automated test suite (Functional, Financial, Security rules)
npm test

# 3. Verify production compilation and bundle splitting
npm run build
```

### Step 2: Firestore Rules Deployment
Rules must be deployed before deploying application code to prevent unauthorized schema access:
```bash
firebase deploy --only firestore:rules
```
*Note: In the AI Studio runtime, security rules are directly verified and deployed via `deploy_firebase`.*

### Step 3: Firestore Indexes Deployment
Composite indexes defined in `/firestore.indexes.json` must be deployed to avoid runtime query index errors:
```bash
firebase deploy --only firestore:indexes
```

### Step 4: Web Application Hosting Deployment
```bash
firebase deploy --only hosting
```

---

## 4. Rollback Instructions

In the event of an unexpected regression or deployment defect:

### Instant Hosting Rollback
Firebase Hosting maintains atomic release versions:
1. Open the Firebase Console -> **Hosting** -> **Release History**.
2. Select the previous stable release hash and click **Rollback**.
3. Or via Firebase CLI:
   ```bash
   firebase hosting:releases:rollback
   ```

### Firestore Rules Rollback
1. To revert security rules to the previous stable revision:
   ```bash
   git checkout <stable_commit_hash> -- firestore.rules
   firebase deploy --only firestore:rules
   ```

---

## 5. Backup & Disaster Recovery (DR)

### Firestore Automated Daily Backups
1. Enable GCP Cloud Firestore scheduled backups:
   ```bash
   gcloud firestore backups schedules create \
       --database='ai-studio-remixindotekproc-842ab28a-fb06-4eda-a8fd-319cb0066637' \
       --retention=30d \
       --recurrence=daily
   ```
2. Point-in-Time Recovery (PITR) is supported up to 7 days for emergency state restoration.

### Manual Data Export
To export all workspace collections to Cloud Storage bucket:
```bash
gcloud firestore export gs://careful-filament-dlxdt-backups/$(date +%Y%m%d_%H%M%S) \
    --database='ai-studio-remixindotekproc-842ab28a-fb06-4eda-a8fd-319cb0066637'
```

---

## 6. Security & Audit Operations
- **Append-only WORM Logs**: The `/audit_logs` collection enforces `allow update, delete: if false;` in Firestore Rules. No system user, administrator, or service account can alter historical audit events.
- **Segregation of Duties**: Procurement team members can create and draft Purchase Orders but cannot self-approve. Approvals require Project Manager or Director review.
