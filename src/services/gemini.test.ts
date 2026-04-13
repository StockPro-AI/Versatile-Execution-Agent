import { describe, it, expect } from 'vitest';
import { normalizeError, ProviderErrorType } from './gemini';

describe('normalizeError', () => {
  it('should detect rate limit errors', () => {
    const err1 = normalizeError(new Error('Rate limit exceeded'), 'openai');
    expect(err1.type).toBe('rate_limit');
    expect(err1.userMessage).toContain('API-Limit');

    const err2 = normalizeError({ status: 429 }, 'gemini');
    expect(err2.type).toBe('rate_limit');
  });

  it('should detect auth errors', () => {
    const err1 = normalizeError(new Error('Invalid API key'), 'mistral');
    expect(err1.type).toBe('auth');
    expect(err1.userMessage).toContain('API-Schlüssel');

    const err2 = normalizeError({ status: 401 }, 'openrouter');
    expect(err2.type).toBe('auth');
  });

  it('should detect timeout errors', () => {
    const err1 = normalizeError(new Error('Request timed out'), 'ollama');
    expect(err1.type).toBe('timeout');
    expect(err1.userMessage).toContain('Timeout');

    const err2 = normalizeError({ status: 408 }, 'openai');
    expect(err2.type).toBe('timeout');
  });

  it('should detect network errors', () => {
    const err1 = normalizeError(new Error('fetch failed'), 'lmstudio');
    expect(err1.type).toBe('network');
    expect(err1.userMessage).toContain('Netzwerkfehler');

    const err2 = normalizeError(new Error('ECONNREFUSED'), 'ollama');
    expect(err2.type).toBe('network');
  });

  it('should detect unavailable errors', () => {
    const err1 = normalizeError(new Error('Service unavailable'), 'openai');
    expect(err1.type).toBe('unavailable');
    expect(err1.userMessage).toContain('nicht erreichbar');

    const err2 = normalizeError({ status: 502 }, 'gemini');
    expect(err2.type).toBe('unavailable');
  });

  it('should fallback to unknown error', () => {
    const err1 = normalizeError(new Error('Something weird happened'), 'openai');
    expect(err1.type).toBe('unknown');
    expect(err1.userMessage).toContain('unbekannter Fehler');
  });

  it('should preserve provider name', () => {
    const err = normalizeError(new Error('test'), 'my-provider');
    expect(err.provider).toBe('my-provider');
  });
});

describe('sendMessageToAgentStream (mocked)', () => {
  it('should fallback to basic text completion for non-gemini providers', async () => {
    // We can't easily test the full fetch call without mocking fetch, 
    // but we can verify the logic structure or just ensure the test file is ready for it.
    // Since we want small maintainable tests, let's just mock global.fetch
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Mocked fallback response' } }]
      })
    }) as any;

    const { sendMessageToAgentStream } = await import('./gemini');
    
    const history: any[] = [];
    const providerConfig: any = { type: 'openai', apiKey: 'test' };
    let finalData: any = null;

    await sendMessageToAgentStream(
      history,
      'Hello',
      providerConfig,
      () => {}, // addCost
      (data) => { if (data.isDone) finalData = data; }
    );

    expect(finalData).not.toBeNull();
    expect(finalData.history[finalData.history.length - 1].parts[0].text).toBe('Mocked fallback response');

    global.fetch = originalFetch;
  });
});
