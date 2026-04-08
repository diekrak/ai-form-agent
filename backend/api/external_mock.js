const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Helper to load config files
const loadConfig = (filename) => {
  const filePath = path.join(__dirname, '../external_mock', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const formSchema = loadConfig('form_schema.json');
const responses = loadConfig('responses.json');

// GET /api/external-mock/form-schema/:type
router.get('/form-schema/:type', (req, res) => {
  const { type } = req.params;
  if (formSchema.formType === type) {
    return res.json(formSchema);
  }
  return res.status(404).json({ error: `Schema not found for type: ${type}` });
});

// POST /api/external-mock/validate-field
router.post('/validate-field', (req, res) => {
  const { fieldName, value } = req.body;

  if (!fieldName || value === undefined) {
    return res.status(400).json({ error: 'fieldName and value are required' });
  }

  const fieldResponses = responses[fieldName];
  if (!fieldResponses) {
    return res.json([]);
  }

  const lowerValue = String(value).toLowerCase();

  const matched = fieldResponses.filter(entry =>
    entry.query.toLowerCase().includes(lowerValue) ||
    lowerValue.includes(entry.query.toLowerCase())
  );

  const seen = new Set();
  const results = [];
  for (const entry of matched) {
    for (const result of entry.results) {
      if (!seen.has(result.value)) {
        seen.add(result.value);
        results.push(result);
      }
    }
  }

  return res.json(results);
});

// POST /api/external-mock/submit-form
router.post('/submit-form', (req, res) => {
  const { formType, data } = req.body;

  if (!formType || !data) {
    return res.status(400).json({ error: 'formType and data are required' });
  }

  const id = uuidv4();
  return res.json({ success: true, id });
});

module.exports = router;
module.exports.handler = (req, res) => {
  // This helps when used as a direct Vercel function if needed
  router(req, res, () => {
    res.status(404).json({ error: 'Not found in external-mock' });
  });
};
