/**
 * backend/tests/mcp.test.js
 * Unit tests for MCP clients with mocked external server.
 * Requerimientos: 3.4, 6.7, 8.3
 */

// Mock mcpClient to avoid dynamic import('node-fetch') issues in Jest
jest.mock('../mcp/mcpClient', () => ({
  mcpGet: jest.fn(),
  mcpPost: jest.fn(),
}));

const { mcpGet, mcpPost } = require('../mcp/mcpClient');
const { getFormSchema } = require('../mcp/getFormSchema');
const { validateField } = require('../mcp/validateField');
const { submitForm } = require('../mcp/submitForm');

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getFormSchema
// ---------------------------------------------------------------------------
describe('getFormSchema', () => {
  test('calls GET /form-schema/:type and returns schema', async () => {
    const mockSchema = { formType: 'work_order', fields: [] };
    mcpGet.mockResolvedValue(mockSchema);

    const result = await getFormSchema('work_order');

    expect(mcpGet).toHaveBeenCalledTimes(1);
    expect(mcpGet).toHaveBeenCalledWith('/form-schema/work_order');
    expect(result).toEqual(mockSchema);
  });

  test('URL-encodes the formType parameter', async () => {
    mcpGet.mockResolvedValue({});

    await getFormSchema('work order/special');

    expect(mcpGet).toHaveBeenCalledWith('/form-schema/work%20order%2Fspecial');
  });

  test('propagates network error from mcpClient', async () => {
    mcpGet.mockRejectedValue(new Error('MCP network error: ECONNREFUSED'));

    await expect(getFormSchema('work_order')).rejects.toThrow('MCP network error');
  });

  test('propagates timeout error from mcpClient', async () => {
    mcpGet.mockRejectedValue(new Error('MCP request timed out after 5000ms'));

    await expect(getFormSchema('work_order')).rejects.toThrow('timed out');
  });
});

// ---------------------------------------------------------------------------
// validateField
// ---------------------------------------------------------------------------
describe('validateField', () => {
  test('calls POST /validate-field with correct body and returns results array', async () => {
    const mockResults = [{ id: '1', label: 'Machine A' }];
    mcpPost.mockResolvedValue(mockResults);

    const result = await validateField('machine_id', 'M-001');

    expect(mcpPost).toHaveBeenCalledTimes(1);
    expect(mcpPost).toHaveBeenCalledWith('/validate-field', {
      fieldName: 'machine_id',
      value: 'M-001',
    });
    expect(result).toEqual(mockResults);
  });

  test('returns empty array when no matches found', async () => {
    mcpPost.mockResolvedValue([]);

    const result = await validateField('machine_id', 'UNKNOWN');

    expect(result).toEqual([]);
  });

  test('propagates network error from mcpClient', async () => {
    mcpPost.mockRejectedValue(new Error('MCP network error: ECONNREFUSED'));

    await expect(validateField('machine_id', 'M-001')).rejects.toThrow('MCP network error');
  });

  test('propagates timeout error from mcpClient', async () => {
    mcpPost.mockRejectedValue(new Error('MCP request timed out after 5000ms'));

    await expect(validateField('machine_id', 'M-001')).rejects.toThrow('timed out');
  });
});

// ---------------------------------------------------------------------------
// submitForm
// ---------------------------------------------------------------------------
describe('submitForm', () => {
  test('calls POST /submit-form with correct body and returns { success, id }', async () => {
    const mockResponse = { success: true, id: 'abc-123' };
    mcpPost.mockResolvedValue(mockResponse);

    const formData = { formType: 'work_order', data: { machine_id: 'M-001' } };
    const result = await submitForm(formData);

    expect(mcpPost).toHaveBeenCalledTimes(1);
    expect(mcpPost).toHaveBeenCalledWith('/submit-form', formData);
    expect(result).toEqual({ success: true, id: 'abc-123' });
  });

  test('returns { success: false } on server-side failure', async () => {
    mcpPost.mockResolvedValue({ success: false });

    const result = await submitForm({ formType: 'work_order', data: {} });

    expect(result.success).toBe(false);
  });

  test('propagates network error from mcpClient', async () => {
    mcpPost.mockRejectedValue(new Error('MCP network error: ECONNREFUSED'));

    await expect(submitForm({ formType: 'work_order', data: {} })).rejects.toThrow('MCP network error');
  });

  test('propagates timeout error from mcpClient', async () => {
    mcpPost.mockRejectedValue(new Error('MCP request timed out after 5000ms'));

    await expect(submitForm({ formType: 'work_order', data: {} })).rejects.toThrow('timed out');
  });
});
