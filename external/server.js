const express = require('express');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

const app = express();
app.use(express.json());

const formSchema = require('./config/form_schema.json');
const responses = require('./config/responses.json');

// GET /form-schema/:type
app.get('/form-schema/:type', (req, res) => {
  const { type } = req.params;
  console.debug(`[external] GET /form-schema/${type}`);
  if (formSchema.formType === type) {
    return res.json(formSchema);
  }
  console.warn(`[external] schema not found for type: ${type}`);
  return res.status(404).json({ error: `Schema not found for type: ${type}` });
});

// POST /validate-field
app.post('/validate-field', (req, res) => {
  const { fieldName, value } = req.body;
  console.debug(`[external] POST /validate-field`, { fieldName, value });

  if (!fieldName || value === undefined) {
    return res.status(400).json({ error: 'fieldName and value are required' });
  }

  const fieldResponses = responses[fieldName];
  if (!fieldResponses) {
    console.debug(`[external] no responses configured for field: ${fieldName}`);
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

  console.debug(`[external] validate-field results`, { fieldName, value, count: results.length });
  return res.json(results);
});

// POST /submit-form
app.post('/submit-form', (req, res) => {
  const { formType, data } = req.body;
  console.debug(`[external] POST /submit-form`, { formType, data });

  if (!formType || !data) {
    return res.status(400).json({ error: 'formType and data are required' });
  }

  const id = uuidv4();
  console.info(`[external] form submitted`, { formType, id });
  return res.json({ success: true, id });
});

const PORT = process.env.EXTERNAL_PORT || 3001;
app.listen(PORT, () => {
  console.log(`External mock server running on port ${PORT}`);
});

module.exports = app;
