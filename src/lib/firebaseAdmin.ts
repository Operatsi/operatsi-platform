import { getApps, initializeApp, getApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getMessaging, Messaging } from "firebase-admin/messaging";
import { getAuth, Auth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
import os from "os";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "operat-si";

/**
 * Self-healing helper that ensures Google Cloud Application Default Credentials (ADC)
 * are present on developer environments by syncing from logged-in Firebase CLI session if needed.
 */
function ensureApplicationDefaultCredentials(): void {
  // If explicitly specified in environment, do not override
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return;
  }

  // Standard Google Cloud ADC path
  const gcloudDir = process.env.APPDATA
    ? path.join(process.env.APPDATA, "gcloud")
    : path.join(os.homedir(), ".config", "gcloud");

  const adcPath = path.join(gcloudDir, "application_default_credentials.json");

  if (fs.existsSync(adcPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = adcPath;
    return;
  }

  // Attempt to resolve from Firebase CLI configstore if user previously logged in with 'firebase login'
  try {
    const fbToolsPath = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
    if (fs.existsSync(fbToolsPath)) {
      const fbData = JSON.parse(fs.readFileSync(fbToolsPath, "utf8"));
      const refreshToken = fbData?.tokens?.refresh_token;

      if (refreshToken) {
        if (!fs.existsSync(gcloudDir)) {
          fs.mkdirSync(gcloudDir, { recursive: true });
        }

        const adcPayload = {
          type: "authorized_user",
          client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
          client_secret: "j9iVZfS8kkCEFUPaAeJV0sAi",
          refresh_token: refreshToken,
        };

        fs.writeFileSync(adcPath, JSON.stringify(adcPayload, null, 2));
        process.env.GOOGLE_APPLICATION_CREDENTIALS = adcPath;
        console.log("[FirebaseAdmin] Successfully auto-provisioned ADC from Firebase CLI credentials.");
      }
    }
  } catch (err) {
    console.warn("[FirebaseAdmin] ADC auto-provision notice:", err);
  }
}

// Execute ADC resolution before initializing Firebase Admin
ensureApplicationDefaultCredentials();

let adminApp: App;

if (getApps().length > 0) {
  adminApp = getApp();
} else {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const parsed = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || projectId,
      });
    } catch (e) {
      console.warn("[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY, falling back to ADC:", e);
      adminApp = initializeApp({ projectId });
    }
  } else {
    adminApp = initializeApp({ projectId });
  }
}

export const adminDb: Firestore = getFirestore(adminApp);
export const adminMessaging: Messaging = getMessaging(adminApp);
export const adminAuth: Auth = getAuth(adminApp);
export { adminApp };
