const { admin, getServiceAccountInfo } = require('../config/firebase');
const db = admin.firestore();

async function firebaseStatus(req, res) {
  try {
    const info = getServiceAccountInfo();
    // Very light Firestore check (harmless read). It may fail if permissions are restricted.
    let firestoreAccessible = false;
    try {
      await db.collection('_health_check').limit(1).get();
      firestoreAccessible = true;
    } catch (err) {
      firestoreAccessible = false;
    }

    return res.json({ ok: true, project_id: info ? info.project_id : null, client_email: info ? info.client_email : null, firestore_accessible: firestoreAccessible });
  } catch (err) {
    console.error('firebase status error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = { firebaseStatus };
