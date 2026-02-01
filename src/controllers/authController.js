const axios = require('axios');
const { getAdmin } = require('../config/firebase');
const admin = getAdmin();
const db = admin.firestore();

async function signup(req, res) {
  const { email, password, displayName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const userRecord = await admin.auth().createUser({ email, password, displayName });
    // Create user doc
    await db.collection('users').doc(userRecord.uid).set({ email, displayName: displayName || null, createdAt: new Date() });
    return res.json({ uid: userRecord.uid, email: userRecord.email });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'FIREBASE_API_KEY not configured' });
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const resp = await axios.post(url, { email, password, returnSecureToken: true });
    // resp.data contains idToken, refreshToken, expiresIn, localId
    return res.json({ token: resp.data.idToken, refreshToken: resp.data.refreshToken, uid: resp.data.localId });
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
    return res.status(400).json({ error: 'Invalid credentials' });
  }
}

async function me(req, res) {
  // req.user set by auth middleware
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    const user = userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : { uid };
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}

module.exports = { signup, login, me };
