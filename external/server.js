const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
app.use(express.json());

const formSchema = require('./config/form_schema.json');
const responses = require('./config/responses.json');

// GET /form-schema/:type
app.get('/form-schema/:type', (req, res) => {
  const { type } = req.params;
  if (formSchema.formType === type) {
    return res.json(formSchema);
  }
  return res.status(404).json({ error: `Schema not found for type: ${type}` });
});

// POST /validate-field
app.post('/validate-field', (req, res) => {
  const { fieldName, value } = req.body;

  if (!fieldName || value === undefined) {
    return res.status(400).json({ error: 'fieldName and value are required' });
  }

  const fieldResponses = responses[fieldName];
  if (!fieldResponses) {
    return res.json([]);
  }

  const lowerValue = String(value).toLowerCase();

  // Find all entries whose query partially matches the value (case-insensitive)
  const matched = fieldResponses.filter(entry =>
    entry.query.toLowerCase().includes(lowerValue) ||
    lowerValue.includes(entry.query.toLowerCase())
  );

  // Collect unique results across all matched entries
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

// POST /submit-form
app.post('/submit-form', (req, res) => {
  const { formType, data } = req.body;

  if (!formType || !data) {
    return res.status(400).json({ error: 'formType and data are required' });
  }

  return res.json({ success: true, id: uuidv4() });
});

const PORT = process.env.EXTERNAL_PORT || 3001;
app.listen(PORT, () => {
  console.log(`External mock server running on port ${PORT}`);
});

module.exports = app;
