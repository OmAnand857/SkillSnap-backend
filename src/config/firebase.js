const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Try to load service account via GOOGLE_APPLICATION_CREDENTIALS, explicit file in project root
function tryLoadServiceAccount() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const p = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (fs.existsSync(p)) return require(p);
  }

  // Look for a file like `*-firebase-adminsdk-*.json` in project root
  const root = path.resolve(__dirname, '../../');
  try {
    const files = fs.readdirSync(root).filter(f => /-firebase-adminsdk-.*\.json$/.test(f));
    if (files.length) return require(path.join(root, files[0]));
  } catch (e) {
    // ignore
  }
  return null;
}

const serviceAccount = tryLoadServiceAccount();

(function init() {
  try {
    if (admin.apps && admin.apps.length) return;

    // Prefer explicit env vars (so .env can hold credentials) over loading a service account file
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey }), projectId: process.env.FIREBASE_PROJECT_ID });
    } else if (serviceAccount) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: serviceAccount.project_id });
    } else {
      // Fallback to environment (GCP) or emulator
      admin.initializeApp();
    }
  } catch (err) {
    console.warn('Firebase init warning:', err.message);
  }
})();

function getServiceAccountInfo() {
  if (serviceAccount) return { project_id: serviceAccount.project_id, client_email: serviceAccount.client_email };
  // Return project id from app options if available
  const app = admin.apps && admin.apps[0];
  if (app && app.options) return { project_id: app.options.projectId || null, client_email: null };
  return null;
}

function getAdmin() {
  if (!admin.apps || admin.apps.length === 0) {
    try {
      if (serviceAccount) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: serviceAccount.project_id });
      } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey }), projectId: process.env.FIREBASE_PROJECT_ID });
      } else {
        admin.initializeApp();
      }
    } catch (err) {
      console.warn('getAdmin init warning:', err.message);
    }
  }
  return admin;
}

module.exports = { initFirebase: () => admin, getAdmin, admin, getServiceAccountInfo };

