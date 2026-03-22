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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
