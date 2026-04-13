/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Briefcase, 
  Search, 
  Database,
  Loader2,
  Sparkles,
  CheckCircle2,
  Activity,
  MoreHorizontal,
  Settings,
  CreditCard,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { sendMessageToAgentStream, ChatMessage, ToolCall, MOCK_DB, AgentStep } from './services/gemini';
import { useProvider, ProviderConfig, ProviderType } from './contexts/ProviderContext';

// --- Components ---

const CostTracker = () => {
  const { totalCost } = useProvider();
  
  return (
    <div className="fixed top-4 right-4 z-50 glass-panel px-4 py-2 rounded-full flex items-center gap-2 border-glow">
      <CreditCard size={14} className="text-gold" />
      <span className="text-xs font-medium text-silver">
        Geschätzte Kosten: <span className="text-white font-bold">${totalCost.toFixed(4)}</span>
      </span>
    </div>
  );
};

const ProviderManagerModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { config, setConfig, availableModels } = useProvider();
  const [localConfig, setLocalConfig] = useState<ProviderConfig>(config);

  useEffect(() => {
    if (isOpen) setLocalConfig(config);
  }, [isOpen, config]);

  const handleSave = () => {
    setConfig(localConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel rounded-3xl p-6 max-w-md w-full border-glow"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white text-glow">API Manager</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Provider</label>
            <select 
              value={localConfig.type}
              onChange={(e) => setLocalConfig({ ...localConfig, type: e.target.value as ProviderType, selectedModel: '' })}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold transition-colors"
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="mistral">Mistral</option>
              <option value="openrouter">OpenRouter</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="lmstudio">LM Studio (Local)</option>
            </select>
          </div>

          {(localConfig.type !== 'ollama' && localConfig.type !== 'lmstudio') && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">API Key</label>
              <input 
                type="password"
                value={localConfig.apiKey}
                onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold transition-colors"
              />
            </div>
          )}

          {(localConfig.type === 'ollama' || localConfig.type === 'lmstudio') && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Base URL</label>
              <input 
                type="text"
                value={localConfig.baseUrl || (localConfig.type === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234')}
                onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold transition-colors"
              />
            </div>
          )}

          {localConfig.type === 'ollama' && (
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                id="cloudFallback"
                checked={localConfig.cloudModelEnabled || false}
                onChange={(e) => setLocalConfig({ ...localConfig, cloudModelEnabled: e.target.checked })}
                className="rounded bg-black/50 border-white/10 text-gold focus:ring-gold"
              />
              <label htmlFor="cloudFallback" className="text-xs text-zinc-400">Cloud-Fallback aktivieren (OpenAI kompatibel)</label>
            </div>
          )}

          {localConfig.type === 'ollama' && localConfig.cloudModelEnabled && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Cloud API Key</label>
              <input 
                type="password"
                value={localConfig.cloudApiKey || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, cloudApiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Modell</label>
            <select 
              value={localConfig.selectedModel}
              onChange={(e) => setLocalConfig({ ...localConfig, selectedModel: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold transition-colors"
            >
              <option value="">Modell auswählen...</option>
              {availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Abbrechen
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-full text-sm font-medium bg-gold text-black hover:bg-yellow-500 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.4)]"
          >
            Speichern
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab, onOpenApiManager, isCollapsed, onToggle }: { activeTab: string, setActiveTab: (t: string) => void, onOpenApiManager: () => void, isCollapsed: boolean, onToggle: () => void }) => {
  const menuItems = [
    { id: 'chat', label: 'Agenten-Chat', icon: Bot },
    { id: 'dashboards', label: 'Dashboards', icon: Activity },
    { id: 'reports', label: 'Berichte', icon: Search },
    { id: 'orders', label: 'Bestellungen', icon: Database },
    { id: 'reviews', label: 'Bewertungen', icon: Briefcase },
  ];

  return (
    <div className={cn(
      "hidden md:flex flex-col h-screen pt-8 pb-6 glass-panel-light border-r border-white/5 transition-all duration-300 ease-in-out shrink-0",
      isCollapsed ? "w-[80px] px-3" : "w-[280px] pl-8 pr-4"
    )}>
      <div className={cn("mb-10 flex items-center", isCollapsed ? "justify-center" : "justify-between px-2")}>
        {!isCollapsed && (
          <button onClick={() => window.location.reload()} className="text-xl font-bold text-white text-glow tracking-tight text-left hover:opacity-70 transition-opacity truncate">
            Retail Agent
          </button>
        )}
        <button onClick={onToggle} className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors flex-shrink-0">
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>
      
      <nav className={cn("flex-1 space-y-1.5", isCollapsed ? "" : "pr-2")}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "w-full flex items-center rounded-full text-[14px] font-medium transition-all",
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
              activeTab === item.id 
                ? "bg-white/10 text-white shadow-sm border border-white/10" 
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            )}
          >
            <item.icon size={16} strokeWidth={activeTab === item.id ? 2.5 : 2} className={activeTab === item.id ? "text-gold shrink-0" : "shrink-0"} />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className={cn("mt-auto", isCollapsed ? "" : "pr-2")}>
        <button 
          onClick={onOpenApiManager}
          title={isCollapsed ? "API Manager" : undefined}
          className={cn(
            "w-full flex items-center rounded-full text-[14px] font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-all border border-transparent hover:border-white/10",
            isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
          )}
        >
          <Settings size={16} className="shrink-0" />
          {!isCollapsed && <span className="truncate">API Manager</span>}
        </button>
      </div>
    </div>
  );
};

const AgentStepBlock = ({ step }: { step: AgentStep }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-3xl transition-all",
        step.status === 'streaming' ? "glass-panel-light border-glow" : "bg-white/5 border border-white/5"
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-black/50 shadow-sm border border-white/10 text-gold"
        )}>
          {step.type === 'tool' ? <Database size={12} /> : <Bot size={12} />}
        </div>
        <span className="font-semibold text-[13px] text-zinc-200 truncate">
          {step.type === 'tool' ? `Werkzeug-Aufruf: ${step.toolName}` : 'Denke nach'}
        </span>
        {step.status === 'streaming' && <Loader2 size={12} className="animate-spin text-gold ml-auto shrink-0" />}
        {step.status === 'completed' && (
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {step.latencyMs !== undefined && (
              <span className="text-[10px] text-zinc-500 font-medium">
                {(step.latencyMs / 1000).toFixed(2)}s
              </span>
            )}
            <div className="text-emerald-400">
              <CheckCircle2 size={14} />
            </div>
          </div>
        )}
      </div>
      
      {step.type === 'tool' && step.toolArgs && (
        <pre className="text-[10px] bg-black/50 text-zinc-400 p-3 rounded-2xl overflow-x-auto mt-3 font-mono whitespace-pre-wrap border border-white/5">
          {JSON.stringify(step.toolArgs, null, 2)}
        </pre>
      )}
      
      {step.type === 'text' && step.content && (
        <div className="text-[13px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">"{step.content}"</div>
      )}

      {step.result && (
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1 text-[11px]">
          <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Ergebnis</span> 
          <span className="text-zinc-300 truncate font-medium">{step.result.message || 'Erfolg'}</span>
        </div>
      )}
    </motion.div>
  );
};

const ChatInterface = ({ 
  history, 
  onSendMessage, 
  isProcessing,
  currentTool,
  agentSteps,
  streamingText,
  setActiveTab
}: { 
  history: ChatMessage[], 
  onSendMessage: (msg: string) => void,
  isProcessing: boolean,
  currentTool: ToolCall | null,
  agentSteps: AgentStep[],
  streamingText: string,
  setActiveTab: (tab: string) => void
}) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isProcessing, currentTool, streamingText]);

  useEffect(() => {
    if (leftScrollRef.current) {
      leftScrollRef.current.scrollTop = leftScrollRef.current.scrollHeight;
    }
  }, [agentSteps]);

  const isGeneratingReport = agentSteps.some(s => s.type === 'tool' && s.toolName === 'generate_yearly_report');
  const isGeneratingDashboard = agentSteps.some(s => s.type === 'tool' && s.toolName === 'create_operations_dashboard');
  const isGeneratingWidget = isGeneratingReport || isGeneratingDashboard;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col md:flex-row-reverse h-auto md:h-full w-full gap-4 md:gap-6">
      {/* Right side: Process & Agent Steps */}
      <div className="min-h-[300px] flex-1 md:min-h-0 md:flex-initial w-full md:w-[60%] flex flex-col rounded-[32px] glass-panel overflow-hidden relative">
        <header className="h-[60px] md:h-[72px] flex items-center px-4 md:px-8 bg-black/20 shrink-0 border-b border-white/5">
          <h2 className="font-semibold text-white text-[15px] flex items-center gap-3 text-glow">
            {isProcessing ? (
              <Loader2 className="text-gold animate-spin" size={16} />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <Activity className="text-gold" size={14} />
              </div>
            )}
            Ausführungsverlauf
          </h2>
        </header>
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 md:pb-8 pt-4 md:pt-6 space-y-4" ref={leftScrollRef}>
          {agentSteps.length === 0 && !isProcessing && (
             <div className="text-zinc-500 text-sm font-medium mt-10 text-center">Starten Sie eine Aufgabe, um hier die Schritte des Agenten zu sehen.</div>
          )}
          {agentSteps.map((step) => (
            <AgentStepBlock key={step.id} step={step} />
          ))}
        </div>
      </div>

      {/* Left side: Chat */}
      <div className="min-h-[450px] flex-1 md:min-h-0 md:flex-initial w-full md:w-[40%] flex flex-col rounded-[32px] glass-panel overflow-hidden relative">
        {/* Header */}
        <header className="h-[60px] md:h-[72px] flex items-center px-4 md:px-8 justify-between shrink-0 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <Bot className="text-gold" size={14} />
            </div>
            <h2 className="font-semibold text-white text-[15px] text-glow">Virtueller Assistent</h2>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8 space-y-6" ref={scrollRef}>
          {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-6">
              <div className="w-16 h-16 bg-white/5 shadow-sm border border-white/10 rounded-full flex items-center justify-center">
                <Bot size={32} className="text-gold" />
              </div>
              <p className="font-medium text-zinc-400">Wie kann ich Ihnen heute helfen?</p>
              <div className="flex flex-wrap justify-center gap-3 w-full max-w-md">
                <button disabled={isProcessing} onClick={() => onSendMessage("Schreibe einen Bericht über die Verkäufe in São Paulo im Jahr 2017.")} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 text-zinc-300 font-medium text-[13px] disabled:opacity-50 disabled:cursor-not-allowed">
                Schreibe einen Bericht über die Verkäufe in São Paulo im Jahr 2017
                </button>
                <button disabled={isProcessing} onClick={() => onSendMessage("Erstelle ein Dashboard über unsere wichtigsten Märkte")} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 text-zinc-300 font-medium text-[13px] disabled:opacity-50 disabled:cursor-not-allowed">
                Erstelle ein Dashboard über unsere wichtigsten Märkte
                </button>
                <button disabled={isProcessing} onClick={() => onSendMessage("Finde die neueste 1-Sterne-Bewertung und erstatte die Bestellung")} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 text-zinc-300 font-medium text-[13px] disabled:opacity-50 disabled:cursor-not-allowed">
                Finde die neueste 1-Sterne-Bewertung und erstatte die Bestellung
                </button>
              </div>
            </div>
          )}

          {history.map((msg, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx} 
              className={cn(
                "flex gap-4 max-w-full",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto mb-1",
                msg.role === 'user' ? "bg-gold text-black" : "bg-white/5 border border-white/10 text-gold shadow-sm"
              )}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              
              <div className={cn(
                "rounded-3xl text-[14px] leading-relaxed max-w-[85%] font-medium",
                msg.role === 'user' 
                  ? "p-5 bg-gold text-black rounded-br-[8px] shadow-[0_0_15px_rgba(212,175,55,0.2)]" 
                  : msg.hasReport || msg.hasDashboard 
                    ? "p-0" 
                    : "p-5 glass-panel-light rounded-bl-[8px] text-zinc-200"
              )}>
                {msg.role === 'model' && (msg.hasReport || msg.hasDashboard) ? (
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    <div className="p-4 glass-panel-light rounded-3xl rounded-bl-[8px] flex flex-col gap-3">
                      <span className="font-medium text-[14px] text-white">
                        {msg.hasReport && msg.hasDashboard ? 'Bericht & Dashboard bereit' : msg.hasReport ? 'Bericht jetzt bereit' : 'Dashboard jetzt bereit'}
                      </span>
                      {msg.latencyMs && (
                        <div className="text-emerald-400 flex items-center gap-1.5 text-[11px] font-medium">
                          <Activity size={12} className="text-emerald-400" /> Latenz {(msg.latencyMs / 1000).toFixed(2)}s
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {msg.hasReport && (
                        <button 
                          onClick={() => setActiveTab('reports')}
                          className="bg-gold text-black px-6 py-3 rounded-full font-medium w-max hover:bg-yellow-500 transition-colors text-[13px] shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center gap-2"
                        >
                          zu den Berichten &rarr;
                        </button>
                      )}
                      {msg.hasDashboard && (
                        <button 
                          onClick={() => setActiveTab('dashboards')}
                          className="bg-gold text-black px-6 py-3 rounded-full font-medium w-max hover:bg-yellow-500 transition-colors text-[13px] shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center gap-2"
                        >
                          zu den Dashboards &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={cn("markdown-body", msg.role === 'user' ? "text-black" : "text-zinc-200")}>
                      <ReactMarkdown>{msg.parts?.map((p: any) => p.text || "").join("") || ""}</ReactMarkdown>
                    </div>

                    {msg.role === 'model' && msg.latencyMs !== undefined && (
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-end text-emerald-400 text-[11px]">
                        <span className="font-mono bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                          <CheckCircle2 size={12} />
                          {(msg.latencyMs / 1000).toFixed(2)}s
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                {/* Grounding Sources */}
                {msg.groundingMetadata?.groundingChunks && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-[10px] font-semibold text-zinc-500 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
                      <Search size={12} /> Quellen
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => (
                        <a 
                          key={i} 
                          href={chunk.web?.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[11px] px-3 py-1.5 bg-black/30 hover:bg-black/50 rounded-full text-zinc-400 border border-white/5 transition-colors"
                        >
                          {chunk.web?.title || new URL(chunk.web?.uri).hostname}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {isProcessing && streamingText && !isGeneratingWidget && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 max-w-full"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto mb-1 bg-white/5 border border-white/10 text-gold shadow-sm">
                <Bot size={14} />
              </div>
              <div className="p-5 rounded-3xl text-[14px] leading-relaxed max-w-[85%] font-medium glass-panel-light rounded-bl-[8px] text-zinc-200 opacity-70">
                <div className="markdown-body text-zinc-200">
                  <ReactMarkdown>{streamingText}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}

          {isProcessing && !streamingText && !isGeneratingWidget && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-gold shadow-sm flex items-center justify-center mt-auto mb-1">
                <Bot size={14} />
              </div>
              <div className="glass-panel-light px-5 py-4 rounded-3xl rounded-bl-[8px] flex items-center gap-2">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {isProcessing && isGeneratingWidget && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 max-w-full"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto mb-1 bg-white/5 border border-white/10 text-gold shadow-sm">
                <Bot size={14} />
              </div>
              <div className="flex flex-col gap-3 min-w-[200px]">
                <div className="p-4 glass-panel-light rounded-3xl rounded-bl-[8px] flex flex-col gap-3">
                  <span className="font-medium text-[14px] text-white">
                    {isGeneratingReport && isGeneratingDashboard ? 'Bericht & Dashboard werden fertiggestellt...' : isGeneratingReport ? 'Bericht wird fertiggestellt...' : 'Dashboard wird fertiggestellt...'}
                  </span>
                  <div className="text-zinc-400 flex items-center gap-1.5 text-[11px] font-medium">
                    <Loader2 size={12} className="animate-spin text-gold" /> Wird fertiggestellt...
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {isGeneratingReport && (
                    <button 
                      disabled
                      className="bg-gold/50 text-black/50 px-6 py-3 rounded-full font-medium w-max text-[13px] shadow-sm flex items-center gap-2 cursor-not-allowed"
                    >
                      zu den Berichten &rarr;
                    </button>
                  )}
                  {isGeneratingDashboard && (
                    <button 
                      disabled
                      className="bg-gold/50 text-black/50 px-6 py-3 rounded-full font-medium w-max text-[13px] shadow-sm flex items-center gap-2 cursor-not-allowed"
                    >
                      zu den Dashboards &rarr;
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 shrink-0 bg-black/20 border-t border-white/5">
          <form onSubmit={handleSubmit} className="relative flex items-center bg-black/50 rounded-full border border-white/10 p-2 focus-within:ring-2 focus-within:ring-gold/20 focus-within:border-gold/50 transition-all">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Schreiben Sie eine Nachricht..."
              disabled={isProcessing}
              className="flex-1 bg-transparent px-5 py-2 outline-none placeholder:text-zinc-500 text-white text-[14px] font-medium"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="w-10 h-10 rounded-full bg-gold text-black flex items-center justify-center disabled:opacity-50 transition-colors ml-2 hover:bg-yellow-500 shadow-[0_0_10px_rgba(212,175,55,0.3)]"
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin text-black" /> : <Send size={16} className="text-black relative right-0.5 top-0.5" strokeWidth={2} />}
            </button>
          </form>

          {history.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4 w-full">
              <button disabled={isProcessing} onClick={() => onSendMessage("Schreibe einen Bericht über die Verkäufe in São Paulo im Jahr 2017.")} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 text-zinc-400 font-medium text-[12px] disabled:opacity-50 disabled:cursor-not-allowed">
              Schreibe einen Bericht über die Verkäufe in São Paulo im Jahr 2017
              </button>
              <button disabled={isProcessing} onClick={() => onSendMessage("Erstelle ein Dashboard über unsere wichtigsten Märkte")} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 text-zinc-400 font-medium text-[12px] disabled:opacity-50 disabled:cursor-not-allowed">
                Erstelle ein Dashboard über unsere wichtigsten Märkte
              </button>
              <button disabled={isProcessing} onClick={() => onSendMessage("Finde die neueste 1-Sterne-Bewertung und erstatte die Bestellung.")} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 text-zinc-400 font-medium text-[12px] disabled:opacity-50 disabled:cursor-not-allowed">
              Finde die neueste 1-Sterne-Bewertung und erstatte die Bestellung
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OrdersView = ({ onAction }: { onAction: (msg?: string) => void }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [orderToRefund, setOrderToRefund] = useState<any>(null);

  const filteredOrders = MOCK_DB.orders.filter(order => 
    order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefundConfirm = () => {
    if (orderToRefund) {
      onAction(`Veranlasse eine Rückerstattung für die Bestellung ${orderToRefund.order_id} in Höhe von ${orderToRefund.amount} wegen 'Kundenwunsch'.`);
      setOrderToRefund(null);
    }
  };

  return (
  <div className="p-4 md:p-8 h-full overflow-y-auto relative">
    {/* Modal */}
    <AnimatePresence>
      {orderToRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl border border-black/5"
          >
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Rückerstattung bestätigen</h3>
            <p className="text-zinc-600 text-sm mb-6">
              Möchten Sie den Status der Bestellung <strong>{orderToRefund.order_id}</strong> wirklich auf 'Refunded' ändern?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setOrderToRefund(null)}
                className="px-4 py-2 rounded-full text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Abbrechen
              </button>
              <button 
                onClick={handleRefundConfirm}
                className="px-4 py-2 rounded-full text-sm font-medium bg-black text-white hover:bg-zinc-800 transition-colors"
              >
                Bestätigen
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 pl-2">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight text-glow">Bestelldatenbank</h2>
          <p className="text-zinc-400 mt-1 text-[15px] font-medium">Verwalten und überwachen Sie alle aktuellen Bestellungen.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text"
            placeholder="Suchen nach ID oder Kunde..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black/50 border border-white/10 rounded-full text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
          />
        </div>
      </div>
      
      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 glass-panel-light rounded-3xl">
            <p className="text-zinc-500 font-medium">Keine Bestellungen gefunden.</p>
          </div>
        ) : (
          filteredOrders.map((order, i) => (
            <div key={i} className="glass-panel-light p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-white/20">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg text-white">{order.order_id}</h3>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-zinc-300 border border-white/10">{order.city}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-6 md:gap-8 text-sm text-zinc-400">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mb-1">Kunde</span>
                    <strong className="text-white text-[15px] font-semibold">{order.customer_id}</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mb-1">Betrag</span>
                    <strong className="text-emerald-400 text-[15px] font-semibold">${order.amount.toLocaleString()}</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mb-1">Datum</span>
                    <strong className="text-zinc-300 text-[15px] font-semibold">{new Date(order.date).toLocaleDateString()}</strong>
                  </div>
                  {order.delivered_date && (
                    <div className="flex flex-col">
                      <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mb-1">Geliefert am</span>
                      <strong className="text-white text-[15px] font-semibold">{new Date(order.delivered_date).toLocaleDateString()}</strong>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <span className={cn(
                  "px-4 py-1.5 text-xs font-medium rounded-full border",
                  order.status === 'Delivered' ? "bg-emerald-900/30 border-emerald-500/30 text-emerald-400" : 
                  order.status === 'Delayed' ? "bg-red-900/30 border-red-500/30 text-red-400" :
                  order.status === 'Refunded' ? "bg-white/5 border-white/10 text-zinc-400" :
                  "bg-black/30 border-white/10 text-white"
                )}>
                  {order.status}
                </span>
                {order.status !== 'Refunded' && (
                  <button 
                    onClick={() => setOrderToRefund(order)}
                    className="px-4 py-1.5 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors"
                  >
                    Bearbeiten
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
  );
};

const ReviewsView = ({ onAction }: { onAction: (msg?: string) => void }) => {
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "score_desc" | "score_asc">("date_desc");

  const sortedReviews = [...(MOCK_DB.reviews || [])].sort((a, b) => {
    if (sortBy === "date_desc") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === "date_asc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === "score_desc") {
      return b.score - a.score;
    } else if (sortBy === "score_asc") {
      return a.score - b.score;
    }
    return 0;
  });

  return (
  <div className="p-4 md:p-8 h-full overflow-y-auto">
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 pl-2">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight text-glow">Kundenbewertungen</h2>
          <p className="text-zinc-400 mt-1 text-[15px] font-medium">Kundenfeedback überwachen und verwalten.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-500">Sortieren nach:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-black/50 border border-white/10 rounded-full px-4 py-2 text-sm font-medium text-zinc-300 focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            <option value="date_desc">Neueste zuerst</option>
            <option value="date_asc">Älteste zuerst</option>
            <option value="score_desc">Höchste Bewertung</option>
            <option value="score_asc">Niedrigste Bewertung</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {sortedReviews.length === 0 ? (
          <div className="text-center py-20 glass-panel-light rounded-3xl">
            <p className="text-zinc-500 font-medium">Keine Bewertungen gefunden.</p>
          </div>
        ) : (
          sortedReviews.map((review, i) => (
            <div key={i} className="glass-panel-light p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start gap-4 transition-all hover:border-white/20">
              <div className="flex gap-5 max-w-full md:max-w-[80%]">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shrink-0 mt-1">
                  <User className="text-zinc-400" size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[17px] text-white">{review.customer_id}</span>
                    <span className="text-[12px] text-zinc-500">•</span>
                    <span className="text-[13px] text-zinc-400 font-medium">{new Date(review.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Sparkles key={star} size={14} className={star <= review.score ? "text-gold fill-gold" : "text-zinc-700"} />
                    ))}
                  </div>
                  <p className="text-zinc-300 text-[15px] leading-relaxed mb-3">"{review.text}"</p>
                  <div className="flex flex-wrap gap-4 text-[12px] font-medium">
                    <span className="flex items-center gap-1.5 text-zinc-400 bg-black/30 px-3 py-1 rounded-full border border-white/5">Bestellung: <strong className="text-zinc-200">{review.order_id}</strong></span>
                    <span className="flex items-center gap-1.5 text-zinc-400 bg-black/30 px-3 py-1 rounded-full border border-white/5">Kategorie: <strong className="text-zinc-200 capitalize">{review.product_category}</strong></span>
                  </div>
                </div>
              </div>
              <button onClick={() => onAction(`Entwerfe eine Kundenantwort für die Bewertung ${review.review_id} von ${review.customer_id}. Biete eine Lösung an.`)} className="px-4 py-2 text-[12px] font-medium rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors whitespace-nowrap">
                Antwort entwerfen
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
  );
};

const ReportsView = ({ onAction }: { onAction: (msg?: string) => void }) => {
  const handleGenerateReport = () => {
    onAction();
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end mb-8 pl-2">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight text-glow">Berichte</h2>
            <p className="text-zinc-400 mt-1 text-[15px] font-medium">Von KI generierte Erkenntnisse und Zusammenfassungen.</p>
          </div>
          <button onClick={handleGenerateReport} className="px-5 py-2.5 bg-gold text-black rounded-full text-[13px] font-medium hover:bg-yellow-500 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)]">
            + Bericht erstellen
          </button>
        </div>

        <div className="grid gap-6">
          {MOCK_DB.reports.length === 0 ? (
            <div className="text-center py-20 glass-panel-light rounded-3xl">
              <p className="text-zinc-500 font-medium">Noch keine Berichte erstellt. Bitten Sie den Agenten, einen Leistungsbericht zu erstellen.</p>
            </div>
          ) : (
            [...MOCK_DB.reports].reverse().map((report, i) => (
              <div key={i} className="glass-panel-light rounded-[32px] overflow-hidden hover:border-white/20 transition-all">
                <div className="bg-black/30 px-10 py-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-semibold text-[20px] text-white tracking-tight">{report.title}</h3>
                  <span className="text-[12px] font-medium bg-white/5 text-zinc-300 px-4 py-1.5 rounded-full border border-white/10">{report.year}</span>
                </div>
                <div className="p-10">
                  <h4 className="font-semibold text-white mb-3 text-[15px]">Zusammenfassung</h4>
                  <p className="text-zinc-400 leading-relaxed mb-10 font-medium text-[14px]">{report.executive_summary}</p>
                  
                  {report.metrics && report.metrics.length > 0 && (
                    <div className="mb-12">
                      <h4 className="font-semibold text-white mb-5 text-[15px]">Wichtige Leistungskennzahlen</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {report.metrics.filter((m: any) => m.value !== 'N/A' && m.value !== 'n/a').map((m: any, idx: number) => (
                          <div key={idx} className="p-6 bg-black/20 border border-white/5 rounded-3xl">
                            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider block mb-2">{m.label}</span>
                            <div className="flex items-end gap-3">
                              <span className="text-[28px] font-semibold text-white tracking-tight leading-none">
                                {m.label.toLowerCase().includes('revenue') || m.label.toLowerCase().includes('value') || m.label.toLowerCase().includes('price') || m.label.toLowerCase().includes('cost') || m.label.toLowerCase().includes('amount') ? '$' : ''}
                                {m.value?.toLocaleString() || 0}
                              </span>
                              {m.trend && m.trend !== 'N/A' && m.trend !== 'n/a' && (
                                <span className={cn(
                                  "text-[13px] font-semibold mb-1",
                                  m.trend.startsWith('+') ? "text-emerald-400" : m.trend.startsWith('-') ? "text-red-400" : "text-zinc-500"
                                )}>
                                  {m.trend}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.detailed_analysis && (
                    <div className="mb-12 border-t border-white/5 pt-10">
                      <h4 className="font-semibold text-white mb-5 text-[15px]">Detaillierte Analyse</h4>
                      <div className="markdown-body text-zinc-400 text-[14px] leading-relaxed font-medium">
                        <ReactMarkdown>{report.detailed_analysis}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-white/5 pt-10">
                    <div>
                      <h4 className="font-semibold text-white mb-5 text-[15px]">Wichtige Erkenntnisse</h4>
                      <div className="grid gap-4">
                        {report.key_insights?.map((insight: string, idx: number) => (
                          <div key={idx} className="bg-black/20 p-5 rounded-[24px] flex items-start gap-4 border border-white/5">
                            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <CheckCircle2 size={12} className="text-gold" />
                            </div>
                            <span className="text-zinc-300 font-medium leading-relaxed text-[13.5px]">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {report.recommendations && (
                      <div>
                        <h4 className="font-semibold text-white mb-5 text-[15px]">Strategische Empfehlungen</h4>
                        <div className="grid gap-4">
                          {report.recommendations?.map((rec: string, idx: number) => (
                            <div key={idx} className="bg-gold/10 text-white p-5 rounded-[24px] flex items-start gap-4 border border-gold/20">
                              <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                                <Sparkles size={12} className="text-gold" />
                              </div>
                              <span className="text-zinc-200 font-medium leading-relaxed text-[13.5px]">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardsView = ({ onAction }: { onAction: (msg?: string) => void }) => {
  const handleGenerateDashboard = () => {
    onAction();
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end mb-8 pl-2">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight text-glow">Dashboards</h2>
            <p className="text-zinc-400 mt-1 text-[15px] font-medium">Visuelle Metriken und Verkaufsleistung.</p>
          </div>
          <button onClick={handleGenerateDashboard} className="px-5 py-2.5 bg-gold text-black rounded-full text-[13px] font-medium hover:bg-yellow-500 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)]">
            + Dashboard erstellen
          </button>
        </div>

        <div className="grid gap-6">
          {MOCK_DB.dashboards.length === 0 ? (
            <div className="text-center py-20 glass-panel-light rounded-3xl">
              <p className="text-zinc-500 font-medium">Noch keine Dashboards erstellt. Bitten Sie den Agenten, ein Dashboard für Verkaufsmetriken zu erstellen.</p>
            </div>
          ) : (
            [...MOCK_DB.dashboards].reverse().map((dashboard, i) => {
              const mainChartMax = Math.max(...(dashboard.main_chart?.data || []).map((m: any) => m.value || 0));
              const secondaryChartMax = Math.max(...(dashboard.secondary_chart?.data || []).map((m: any) => m.value || 0));

              return (
                <div key={i} className="flex flex-col gap-6 mb-12">
                  <h3 className="font-semibold text-2xl text-white tracking-tight pl-2">{dashboard.title}</h3>
                  
                  {/* KPIs Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {dashboard.kpis?.filter((kpi: any) => kpi.value !== 'N/A' && kpi.value !== 'n/a').map((kpi: any, idx: number) => (
                      <div key={idx} className="glass-panel-light p-6 rounded-3xl flex flex-col justify-between hover:border-white/20 transition-all">
                        <span className="text-[12px] text-zinc-500 font-medium uppercase tracking-wider mb-2">{kpi.label}</span>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-bold text-white tracking-tight leading-none">{kpi.value}</span>
                          {kpi.trend && kpi.trend !== 'N/A' && kpi.trend !== 'n/a' && (
                            <span className={cn(
                              "text-[12px] font-semibold",
                              kpi.trend.startsWith('+') ? "text-emerald-400" : kpi.trend.startsWith('-') ? "text-red-400" : "text-zinc-500"
                            )}>
                              {kpi.trend}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 glass-panel-light p-8 rounded-[32px] flex flex-col">
                      <h4 className="font-semibold text-[17px] text-white tracking-tight mb-1">{dashboard.main_chart?.title}</h4>
                      <p className="text-[10px] text-zinc-500 font-medium mb-8 uppercase tracking-wider">{dashboard.main_chart?.type} Diagramm</p>
                      
                      <div className="flex-1 flex flex-col justify-start gap-5">
                        {dashboard.main_chart?.data?.map((metric: any, idx: number) => {
                          const heightPercent = mainChartMax > 0 ? (metric.value / mainChartMax) * 100 : 0;
                          return (
                            <div key={idx} className="flex items-center gap-5">
                              <div className="w-24 text-[13px] font-medium text-zinc-400 truncate text-right">{metric.label}</div>
                              <div className="flex-1 h-9 bg-black/30 rounded-full flex items-center border border-white/5 p-1.5 relative overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.max(heightPercent, 5)}%` }}
                                  className="h-full bg-gold rounded-full shadow-[0_0_10px_rgba(212,175,55,0.3)] absolute left-1.5"
                                />
                                <span className={cn("text-[12px] font-semibold tracking-tight absolute z-10", heightPercent > 15 ? "text-black left-4" : "text-zinc-300 left-8")} style={{ left: heightPercent > 15 ? 16 : `calc(${Math.max(heightPercent, 5)}% + 14px)` }}>
                                  {metric.value.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-6">
                      {/* Secondary Chart */}
                      <div className="glass-panel-light p-8 rounded-[32px] flex-1">
                        <h4 className="font-semibold text-[15px] text-white tracking-tight mb-1">{dashboard.secondary_chart?.title}</h4>
                        <p className="text-[10px] text-zinc-500 font-medium mb-6 uppercase tracking-wider">{dashboard.secondary_chart?.type} Diagramm</p>
                        
                        <div className="flex flex-col gap-4">
                          {dashboard.secondary_chart?.data?.map((metric: any, idx: number) => {
                            const pct = secondaryChartMax > 0 ? (metric.value / secondaryChartMax) * 100 : 0;
                            return (
                              <div key={idx} className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-[12px] font-medium">
                                  <span className="text-zinc-400 truncate mr-2">{metric.label}</span>
                                  <span className="text-white font-semibold">{metric.value.toLocaleString()}</span>
                                </div>
                                <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden border border-white/5">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    className="h-full bg-gold rounded-full shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="glass-panel-light p-8 rounded-[32px] flex-1">
                        <h4 className="font-semibold text-[15px] text-white tracking-tight mb-6">Kurze Erkenntnisse</h4>
                        <div className="flex flex-col gap-4">
                          {dashboard.recent_activity?.map((activity: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Activity size={10} className="text-gold" />
                              </div>
                              <p className="text-[13px] text-zinc-400 leading-relaxed font-medium">{activity.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const menuItems = [
    { id: 'chat', label: 'Chat', icon: Bot },
    { id: 'dashboards', label: 'Statistiken', icon: Activity },
    { id: 'reports', label: 'Berichte', icon: Search },
    { id: 'orders', label: 'Bestellungen', icon: Database },
    { id: 'reviews', label: 'Bewertungen', icon: Briefcase },
  ];

  return (
    <div className="md:hidden flex items-center justify-around bg-black/50 border-t border-white/5 px-2 py-3 shrink-0 pb-safe">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            activeTab === item.id 
              ? "text-gold" 
              : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTool, setCurrentTool] = useState<ToolCall | null>(null);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isApiManagerOpen, setIsApiManagerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { config, addCost } = useProvider();

  const handleSendMessage = async (msg: string) => {
    setIsProcessing(true);
    setStreamingText("");
    setAgentSteps([]);
    try {
      await sendMessageToAgentStream(history, msg, config, addCost, (data) => {
        if (data.isDone) {
          setHistory(data.history);
          setIsProcessing(false);
          setStreamingText("");
        } else {
          setHistory(data.history);
          setAgentSteps(data.steps);
          setStreamingText(data.currentText);
        }
      });
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  const handleAction = (msg?: string) => {
    setActiveTab('chat');
    if (msg) {
      handleSendMessage(msg);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen font-sans text-zinc-300 bg-[#0a0a0c] overflow-hidden selection:bg-gold selection:text-black">
      <CostTracker />
      <ProviderManagerModal isOpen={isApiManagerOpen} onClose={() => setIsApiManagerOpen(false)} />
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenApiManager={() => setIsApiManagerOpen(true)} 
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center px-6 pt-6 pb-2 shrink-0">
        <button onClick={() => window.location.reload()} className="text-2xl font-bold text-white text-glow tracking-tight text-left hover:opacity-70 transition-opacity">
          Retail Agenten-Dashboard
        </button>
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative px-4 pb-4 pt-2 md:pt-6 md:pb-6 md:pr-6 md:pl-2">
        <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden relative">
          {activeTab === 'chat' && (
            <ChatInterface 
              history={history} 
              onSendMessage={handleSendMessage} 
              isProcessing={isProcessing}
              currentTool={currentTool}
              agentSteps={agentSteps}
              streamingText={streamingText}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'orders' && <OrdersView onAction={handleAction} />}
          {activeTab === 'reviews' && <ReviewsView onAction={handleAction} />}
          {activeTab === 'reports' && <ReportsView onAction={handleAction} />}
          {activeTab === 'dashboards' && <DashboardsView onAction={handleAction} />}
        </div>
        
        <div className="mt-4 px-4 text-[11px] text-zinc-500 text-center md:text-right shrink-0">
          Daten via <a href="https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce" target="_blank" className="underline hover:text-silver font-medium">Olist E-Commerce Dataset</a>
        </div>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
