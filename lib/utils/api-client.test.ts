import { describe, it, expect } from 'vitest';
import { safeParseApiResponse } from './api-client';

describe('safeParseApiResponse', () => {
  it('parses valid JSON success responses', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true, inserted: 25 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await safeParseApiResponse<{ success: boolean; inserted: number }>(mockResponse);
    expect(result).toEqual({ success: true, inserted: 25 });
  });

  it('extracts error messages from JSON error responses without throwing syntax error', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'No valid candidate rows found.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(safeParseApiResponse(mockResponse)).rejects.toThrow(
      'No valid candidate rows found.'
    );
  });

  it('handles HTML 404 responses gracefully instead of producing Unexpected token <', async () => {
    const html404 = `<!DOCTYPE html><html><head><title>404: This page could not be found</title></head><body><h1>404</h1></body></html>`;
    const mockResponse = new Response(html404, {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'text/html' },
    });

    await expect(safeParseApiResponse(mockResponse)).rejects.toThrow(
      'API endpoint not found (HTTP 404)'
    );
  });

  it('handles HTML 502/503/504 gateway errors gracefully', async () => {
    const html502 = `<!DOCTYPE html><html><body>502 Bad Gateway</body></html>`;
    const mockResponse = new Response(html502, {
      status: 502,
      statusText: 'Bad Gateway',
      headers: { 'Content-Type': 'text/html' },
    });

    await expect(safeParseApiResponse(mockResponse)).rejects.toThrow(
      'Service temporarily unavailable (HTTP 502)'
    );
  });

  it('handles unexpected non-JSON 200 responses safely', async () => {
    const textResponse = new Response('Plain text message', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });

    await expect(safeParseApiResponse(textResponse)).rejects.toThrow(
      'Unexpected non-JSON response format (HTTP 200)'
    );
  });
});
