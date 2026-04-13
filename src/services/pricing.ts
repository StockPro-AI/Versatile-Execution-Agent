export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface ModelPricing {
  promptCostPer1k: number;
  completionCostPer1k: number;
}

// Pricing in USD per 1000 tokens
export const PRICING_TABLE: Record<string, ModelPricing> = {
  // Gemini Models
  'gemini-3.1-flash-lite-preview': { promptCostPer1k: 0.000075, completionCostPer1k: 0.0003 },
  'gemini-2.5-flash': { promptCostPer1k: 0.000075, completionCostPer1k: 0.0003 },
  'gemini-2.5-pro': { promptCostPer1k: 0.00125, completionCostPer1k: 0.005 },
  'gemini-1.5-flash': { promptCostPer1k: 0.000075, completionCostPer1k: 0.0003 },
  'gemini-1.5-pro': { promptCostPer1k: 0.00125, completionCostPer1k: 0.005 },

  // OpenAI Models
  'gpt-4o': { promptCostPer1k: 0.0025, completionCostPer1k: 0.01 },
  'gpt-4o-mini': { promptCostPer1k: 0.00015, completionCostPer1k: 0.0006 },
  'gpt-4-turbo': { promptCostPer1k: 0.01, completionCostPer1k: 0.03 },
  'gpt-3.5-turbo': { promptCostPer1k: 0.0005, completionCostPer1k: 0.0015 },
  'o1-preview': { promptCostPer1k: 0.015, completionCostPer1k: 0.06 },
  'o1-mini': { promptCostPer1k: 0.003, completionCostPer1k: 0.012 },

  // Mistral Models
  'mistral-large-latest': { promptCostPer1k: 0.002, completionCostPer1k: 0.006 },
  'mistral-small-latest': { promptCostPer1k: 0.0002, completionCostPer1k: 0.0006 },
  'open-mistral-nemo': { promptCostPer1k: 0.00015, completionCostPer1k: 0.00015 },
  'codestral-latest': { promptCostPer1k: 0.0002, completionCostPer1k: 0.0006 },
};

export function calculateCost(modelName: string, usage: TokenUsage | undefined, providerType: string): number {
  if (!usage) {
    return getFallbackCost(providerType);
  }

  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;

  // For local models, cost is 0
  if (providerType === 'ollama' || providerType === 'lmstudio') {
    return 0;
  }

  // Find pricing for the model
  let pricing = PRICING_TABLE[modelName];

  // If exact model not found, try to match by prefix/includes
  if (!pricing) {
    const matchedKey = Object.keys(PRICING_TABLE).find(key => modelName.includes(key));
    if (matchedKey) {
      pricing = PRICING_TABLE[matchedKey];
    }
  }

  if (pricing) {
    const promptCost = (promptTokens / 1000) * pricing.promptCostPer1k;
    const completionCost = (completionTokens / 1000) * pricing.completionCostPer1k;
    return promptCost + completionCost;
  }

  // Fallback if pricing is unknown
  return getFallbackCost(providerType);
}

function getFallbackCost(providerType: string): number {
  if (providerType === 'ollama' || providerType === 'lmstudio') return 0;
  if (providerType === 'gemini') return 0.0005;
  return 0.001;
}
