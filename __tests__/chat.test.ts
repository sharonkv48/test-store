import { POST } from '@/app/api/chat/route';
import * as logger from '@/lib/logger';

// Mock the groq module
jest.mock('@/lib/groq', () => ({
  groq: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

// Mock the logger functions
jest.mock('@/lib/logger', () => ({
  logSessionStart: jest.fn(),
  logUserMessage: jest.fn(),
  logAnalysisStarted: jest.fn(),
  logAnalysisComplete: jest.fn(),
  logUnhandledIntent: jest.fn(),
  logApiError: jest.fn(),
}));

const mockGroq = require('@/lib/groq').groq;

describe('POST /api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Normal analysis request — returns a ReadableStream', async () => {
    const mockStream = (async function* () {
      yield { choices: [{ delta: { content: '## Resume Analysis' } }] };
      yield { choices: [{ delta: { content: '\n\n**Overall Score: 7/10**' } }] };
    })();

    mockGroq.chat.completions.create.mockResolvedValue(mockStream);

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test-session-123',
        messages: [{ role: 'user', content: 'John Doe\nSoftware Engineer\n5 years experience...' }],
      }),
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.body).toBeInstanceOf(ReadableStream);
  });

  test('2. PDF upload attempt — logs UNHANDLED_INTENT with category pdf_upload', async () => {
    const mockStream = (async function* () {
      yield { choices: [{ delta: { content: "I can't process PDF files directly." } }] };
    })();

    mockGroq.chat.completions.create.mockResolvedValue(mockStream);

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test-session-456',
        messages: [{ role: 'user', content: 'Here is my PDF resume...' }],
      }),
    });

    await POST(request);

    // Wait for stream to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(logger.logUnhandledIntent).toHaveBeenCalledWith(
      'test-session-456',
      'Here is my PDF resume...',
      'pdf_upload'
    );
  });

  test('3. Missing sessionId — returns HTTP 400', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });

    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('sessionId is required');
  });

  test('4. Empty messages array — returns HTTP 400', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test-session-789',
        messages: [],
      }),
    });

    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('messages must be a non-empty array');
  });

  test('5. Groq API error — logs API_ERROR and returns HTTP 500', async () => {
    mockGroq.chat.completions.create.mockRejectedValue(new Error('API rate limit exceeded'));

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test-session-error',
        messages: [{ role: 'user', content: 'Analyse this resume...' }],
      }),
    });

    const response = await POST(request);
    
    expect(response.status).toBe(500);
    expect(logger.logApiError).toHaveBeenCalledWith('test-session-error', expect.any(Error));
  });

  test('6. First message — calls logSessionStart', async () => {
    const mockStream = (async function* () {
      yield { choices: [{ delta: { content: 'Hello!' } }] };
    })();

    mockGroq.chat.completions.create.mockResolvedValue(mockStream);

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test-session-first',
        messages: [{ role: 'user', content: 'Hello, can you help me?' }],
      }),
    });

    await POST(request);

    expect(logger.logSessionStart).toHaveBeenCalledWith('test-session-first');
  });
});
