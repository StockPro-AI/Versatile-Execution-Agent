import { describe, it, expect } from 'vitest';
import { calculateCost, PRICING_TABLE } from './pricing';

describe('calculateCost', () => {
  it('should calculate cost correctly for known models', () => {
    // gpt-4o: prompt 0.0025/1k, completion 0.01/1k
    const usage = { prompt_tokens: 1000, completion_tokens: 500 };
    const cost = calculateCost('gpt-4o', usage, 'openai');
    expect(cost).toBe(0.0025 + 0.005); // 0.0075
  });

  it('should calculate cost correctly for gemini models', () => {
    // gemini-2.5-flash: prompt 0.000075/1k, completion 0.0003/1k
    const usage = { prompt_tokens: 2000, completion_tokens: 1000 };
    const cost = calculateCost('gemini-2.5-flash', usage, 'gemini');
    expect(cost).toBe(0.00015 + 0.0003); // 0.00045
  });

  it('should fallback to 0 for local providers even with usage', () => {
    const usage = { prompt_tokens: 1000, completion_tokens: 1000 };
    expect(calculateCost('llama3', usage, 'ollama')).toBe(0);
    expect(calculateCost('llama3', usage, 'lmstudio')).toBe(0);
  });

  it('should fallback to 0 for local providers without usage', () => {
    expect(calculateCost('llama3', undefined, 'ollama')).toBe(0);
  });

  it('should use fallback cost for unknown models', () => {
    const usage = { prompt_tokens: 1000, completion_tokens: 1000 };
    const cost = calculateCost('unknown-model-xyz', usage, 'openai');
    expect(cost).toBe(0.001); // default fallback for non-gemini
  });

  it('should use fallback cost when usage is undefined', () => {
    expect(calculateCost('gpt-4o', undefined, 'openai')).toBe(0.001);
    expect(calculateCost('gemini-2.5-flash', undefined, 'gemini')).toBe(0.0005);
  });

  it('should match model names by prefix/includes', () => {
    // If the model is "gpt-4o-2024-05-13", it should match "gpt-4o"
    const usage = { prompt_tokens: 1000, completion_tokens: 500 };
    const cost = calculateCost('gpt-4o-2024-05-13', usage, 'openai');
    expect(cost).toBe(0.0025 + 0.005); // 0.0075
  });

  it('should handle partial usage data', () => {
    const usage = { prompt_tokens: 1000 }; // Missing completion_tokens
    const cost = calculateCost('gpt-4o', usage, 'openai');
    expect(cost).toBe(0.0025);
  });
});
