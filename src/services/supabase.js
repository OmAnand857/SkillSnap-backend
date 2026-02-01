const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) console.warn('Supabase not configured (SUPABASE_URL/SUPABASE_KEY)');

const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');

async function uploadCertificate(bucket, path, buffer) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, { contentType: 'application/pdf', upsert: true });
  if (error) throw error;
  return data;
}

function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data && data.publicUrl ? data.publicUrl : null;
}

async function createSignedUrl(bucket, path, expiresIn = 60 * 60) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedURL;
}

module.exports = { supabase, uploadCertificate, getPublicUrl, createSignedUrl };
