import React, { createContext, useContext, useState, useEffect } from 'react';

export type ProviderType = 'gemini' | 'openai' | 'mistral' | 'openrouter' | 'ollama' | 'lmstudio';

export interface ProviderConfig {
  type: ProviderType;
  apiKey: string;
  baseUrl?: string;
  selectedModel: string;
  cloudModelEnabled?: boolean; // For Ollama
  cloudApiKey?: string; // For Ollama cloud fallback
}

interface ProviderContextType {
  config: ProviderConfig;
  setConfig: (config: ProviderConfig) => void;
  availableModels: string[];
  fetchModels: (config: ProviderConfig) => Promise<void>;
  totalCost: number;
  addCost: (cost: number) => void;
}

const defaultProvider: ProviderConfig = {
  type: 'gemini',
  apiKey: '',
  selectedModel: 'gemini-3.1-flash-lite-preview',
};

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

export const ProviderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<ProviderConfig>(() => {
    const saved = localStorage.getItem('llm_provider_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return defaultProvider;
  });

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [totalCost, setTotalCost] = useState<number>(() => {
    const saved = localStorage.getItem('llm_total_cost');
    return saved ? parseFloat(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('llm_provider_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('llm_total_cost', totalCost.toString());
  }, [totalCost]);

  const setConfig = (newConfig: ProviderConfig) => {
    setConfigState(newConfig);
  };

  const addCost = (cost: number) => {
    setTotalCost(prev => prev + cost);
  };

  const fetchModels = async (currentConfig: ProviderConfig) => {
    try {
      if (currentConfig.type === 'gemini') {
        setAvailableModels(['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash', 'gemini-2.5-pro']);
        return;
      }

      let url = '';
      let headers: Record<string, string> = {};

      if (currentConfig.type === 'openai') {
        url = 'https://api.openai.com/v1/models';
        headers = { Authorization: `Bearer ${currentConfig.apiKey}` };
      } else if (currentConfig.type === 'mistral') {
        url = 'https://api.mistral.ai/v1/models';
        headers = { Authorization: `Bearer ${currentConfig.apiKey}` };
      } else if (currentConfig.type === 'openrouter') {
        url = 'https://openrouter.ai/api/v1/models';
        headers = { Authorization: `Bearer ${currentConfig.apiKey}` };
      } else if (currentConfig.type === 'ollama') {
        url = `${currentConfig.baseUrl || 'http://localhost:11434'}/api/tags`;
      } else if (currentConfig.type === 'lmstudio') {
        url = `${currentConfig.baseUrl || 'http://localhost:1234'}/v1/models`;
      }

      if (!url) return;

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('Failed to fetch models');
      
      const data = await response.json();
      
      if (currentConfig.type === 'ollama') {
        setAvailableModels(data.models?.map((m: any) => m.name) || []);
      } else {
        setAvailableModels(data.data?.map((m: any) => m.id) || []);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setAvailableModels([]);
    }
  };

  useEffect(() => {
    fetchModels(config);
  }, [config.type, config.apiKey, config.baseUrl]);

  return (
    <ProviderContext.Provider value={{ config, setConfig, availableModels, fetchModels, totalCost, addCost }}>
      {children}
    </ProviderContext.Provider>
  );
};

export const useProvider = () => {
  const context = useContext(ProviderContext);
  if (!context) throw new Error('useProvider must be used within ProviderProvider');
  return context;
};
