const { getSkills } = require('../models/problemModel');

async function listSkills(req, res) {
  try {
    const skills = await getSkills();
    return res.json({ skills });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch skills' });
  }
}

module.exports = { listSkills };
