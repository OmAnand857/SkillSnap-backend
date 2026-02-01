require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { initFirebase } = require('./config/firebase');

const authRoutes = require('./routes/auth');
const skillsRoutes = require('./routes/skills');
const assessmentsRoutes = require('./routes/assessments');
const executeRoutes = require('./routes/execute');
const debugRoutes = require('./routes/debug');

const app = express();
const PORT = process.env.PORT || 4000;

// Init
initFirebase();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '200kb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/debug', debugRoutes);

app.get('/', (req, res) => res.json({ ok: true, server: 'skillsnap-backend' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
