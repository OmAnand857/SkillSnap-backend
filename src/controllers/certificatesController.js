const PDFDocument = require('pdfkit');
const { getAdmin } = require('../config/firebase');
const { uploadCertificate, createSignedUrl, getPublicUrl } = require('../services/supabase');

const db = getAdmin().firestore();

// Helper to generate a simple certificate PDF in memory
function generateCertificatePdf({ userName, skillName, dateIssued, verifiedId }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.fontSize(20).text('SkillSnap Certificate', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(14).text(`Awarded to: ${userName}`, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(12).text(`For skill: ${skillName}`, { align: 'center' });
    doc.moveDown(1);
    doc.text(`Date: ${dateIssued}`, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(10).text(`Verified ID: ${verifiedId}`, { align: 'center' });
    doc.end();
  });
}

async function createCertificate(req, res) {
  // Open endpoint: allows unauthenticated creation. NOTE: This is intentionally open but insecure — consider requiring auth or internal secret for production.
  const { userId, userName, skillId, skillName } = req.body;
  const targetUserId = userId || null;

  if (!userName || !skillId || !skillName) return res.status(400).json({ error: 'Missing required fields (userName/skillId/skillName)' });

  try {
    const issuedAt = new Date().toISOString();
    const verifiedId = `${skillId}-${targetUserId}-${Date.now().toString(36)}`;

    // create Firestore doc
    const certRef = await db.collection('certificates').add({ userId: targetUserId, userName, skillId, skillName, issuedAt, verifiedId, storagePath: null });
    const certId = certRef.id;

    // generate PDF
    const pdfBuffer = await generateCertificatePdf({ userName, skillName, dateIssued: issuedAt, verifiedId });

    // upload to Supabase storage bucket 'certificates' with path `certificates/<certId>.pdf`
    const bucket = process.env.SUPABASE_CERT_BUCKET || 'certificates';
    const path = `certificates/${certId}.pdf`;
    await uploadCertificate(bucket, path, pdfBuffer);

    // get signed url
    let url = null;
    try {
      url = await createSignedUrl(bucket, path, 60 * 60 * 24 * 7); // 7 days
    } catch (e) {
      // fallback to public url
      url = getPublicUrl(bucket, path);
    }

    await certRef.update({ storagePath: path, url });

    return res.json({ id: certId, url, verifiedId });
  } catch (err) {
    console.error('createCertificate error', err);
    return res.status(500).json({ error: 'Failed to create certificate' });
  }
}

async function getCertificate(req, res) {
  const { id } = req.params;
  try {
    const doc = await db.collection('certificates').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Certificate not found' });
    const data = doc.data();

    // if storagePath exists, produce a signed url if possible
    if (data.storagePath && data.url) {
      return res.json({ id: doc.id, ...data });
    }

    // no url - try to generate signed url if storagePath and SUPABASE configured
    if (data.storagePath && process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        const bucket = process.env.SUPABASE_CERT_BUCKET || 'certificates';
        const signed = await createSignedUrl(bucket, data.storagePath, 60 * 60);
        return res.json({ id: doc.id, ...data, url: signed });
      } catch (e) {
        console.warn('failed to create signed url', e.message);
      }
    }

    return res.json({ id: doc.id, ...data });
  } catch (err) {
    console.error('getCertificate error', err);
    return res.status(500).json({ error: 'Failed to fetch certificate' });
  }
}

module.exports = { createCertificate, getCertificate };
