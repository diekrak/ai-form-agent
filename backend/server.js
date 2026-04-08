require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Servir el frontend estático
app.use(express.static(path.join(__dirname, '../frontend/web')));

// API routes
app.use('/api/session', require('./api/session'));
app.use('/api/chat', require('./api/chat'));
app.use('/api/external-mock', require('./api/external_mock'));

const { exec } = require('child_process');
const os = require('os');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Backend running on ${url}`);

  // Abrir navegador automáticamente (solo en local)
  if (process.env.NODE_ENV !== 'production') {
    const startCmd = os.platform() === 'darwin' ? 'open' : os.platform() === 'win32' ? 'start' : 'xdg-open';
    exec(`${startCmd} ${url}`);
  }
});
