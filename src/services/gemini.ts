/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type, Content } from "@google/genai";
import realData from '../data.json';

// Initialize Gemini Client
// We use the 'gemini-2.5-flash-latest' model as requested for "Gemini Flash"
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const MODEL_NAME = "gemini-3.1-flash-lite-preview";

export interface ChatMessage extends Content {
  timestamp: Date;
  latencyMs?: number;
  groundingMetadata?: any;
  hasReport?: boolean;
  hasDashboard?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface ToolResult {
  id: string;
  name: string;
  result: any;
}

// Mock Database for the agent to interact with (E-Commerce data)
export const MOCK_DB = {
  orders: realData.orders as any[],
  dashboards: [] as any[],
  reports: [] as any[],
  agents: [] as any[],
  reviews: realData.reviews as any[],
  customer_responses: [] as any[],
};

// Tool Definitions
export const tools = [
  {
    functionDeclarations: [
      {
        name: "analyze_sales_performance",
        description: "Fetches revenue and order volume data by date range or category.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            date_range: { type: Type.STRING, description: "e.g., '2023-Q4' or 'last 30 days'" },
            group_by: { type: Type.STRING, description: "e.g., 'product_category', 'city'" },
            city: { type: Type.STRING, description: "Optional city to filter sales data by (e.g., 'sao paulo')" }
          },
          required: ["date_range"],
        },
      },
      {
        name: "investigate_shipping_delays",
        description: "Cross-references delivery dates to find bottlenecks.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            region: { type: Type.STRING, description: "e.g., 'São Paulo'" },
          },
          required: [],
        },
      },
      {
        name: "analyze_customer_sentiment",
        description: "Pulls review scores and text for specific products or generally.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            product_category: { type: Type.STRING, description: "Category of product, e.g. 'electronics'" },
            score_filter: { type: Type.NUMBER, description: "Review score to filter by, e.g. 1" }
          },
          required: [],
        },
      },
      {
        name: "issue_refund",
        description: "Updates the status of an order in the database and records a refund.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            order_id: { type: Type.STRING, description: "The ID of the order to refund" },
            refund_amount: { type: Type.NUMBER, description: "The amount to refund" },
            reason_code: { type: Type.STRING, description: "Reason for the refund" }
          },
          required: ["order_id", "refund_amount"],
        },
      },
      {
        name: "draft_customer_response",
        description: "Generates and saves a draft response to a specific customer review.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            customer_id: { type: Type.STRING },
            review_id: { type: Type.STRING },
            proposed_solution: { type: Type.STRING, description: "What to offer the customer (e.g., 20% discount)" }
          },
          required: ["customer_id", "review_id", "proposed_solution"],
        },
      },
      {
        name: "start_ai_agent",
        description: "Start a sub-agent to complete a complex analysis or data gathering task autonomously.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            agent_name: { type: Type.STRING, description: "Name of the sub-agent" },
            task_description: { type: Type.STRING, description: "Detailed description of the complex task for the sub-agent to complete" },
          },
          required: ["agent_name", "task_description"],
        },
      },
      {
        name: "generate_yearly_report",
        description: "Generate a detailed text-based business report. Do NOT use this tool if the user asks for a dashboard.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            year: { type: Type.NUMBER },
            executive_summary: { type: Type.STRING, description: "High-level summary of the findings" },
            detailed_analysis: { type: Type.STRING, description: "In-depth plain-text analysis and business narrative. Do NOT use markdown." },
            key_insights: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key insights" },
            metrics: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  trend: { type: Type.STRING, description: "e.g. '+15%', '-5%'" }
                }
              },
              description: "Key financial and operational metrics to visualize"
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strategic recommendations based on data" },
          },
          required: ["title", "year", "executive_summary", "detailed_analysis", "key_insights", "metrics", "recommendations"],
        },
      },
      {
        name: "create_operations_dashboard",
        description: "Create a rich data visualization dashboard. You MUST use this tool (and not the report tool) when the user asks for a dashboard.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            kpis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  trend: { type: Type.STRING, description: "e.g., '+12%', '-5%'" }
                }
              },
              description: "Top-level summary metrics"
            },
            main_chart: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                type: { type: Type.STRING, description: "Type of chart (e.g., 'bar', 'line')" },
                data: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.NUMBER }
                    }
                  }
                }
              }
            },
            secondary_chart: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                type: { type: Type.STRING, description: "Type of chart (e.g., 'pie', 'bar')" },
                data: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.NUMBER }
                    }
                  }
                }
              },
              description: "An additional chart to show secondary insights (like category breakdowns)"
            },
            recent_activity: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING }
                }
              },
              description: "List of 3-5 recent data points or quick insight bullets related to the dashboard"
            }
          },
          required: ["title", "kpis", "main_chart", "secondary_chart", "recent_activity"],
        },
      },
    ],
  },
];

export interface AgentStep {
  id: string;
  type: 'text' | 'tool';
  content?: string;
  toolName?: string;
  toolArgs?: any;
  result?: any;
  status: 'pending' | 'streaming' | 'completed' | 'error';
  latencyMs?: number;
}

export async function sendMessageToAgentStream(
  history: ChatMessage[],
  newMessage: string,
  onUpdate: (data: { history: ChatMessage[], steps: AgentStep[], isDone: boolean, currentText: string }) => void
): Promise<void> {
  const sdkHistory = history
    .filter(h => h.role !== 'system')
    .map(h => {
      const { timestamp, latencyMs, groundingMetadata, ...content } = h;
      return content;
    });

  const contents: Content[] = [
    ...sdkHistory,
    { role: "user", parts: [{ text: newMessage }] }
  ];
  
    const config = {
    tools: tools,
    systemInstruction: `Sie sind ein erstklassiger E-Commerce Operations Agent für einen schnell wachsenden Marktplatz. 
      Ihr Ziel ist es, selbstständig Verkaufsdaten zu analysieren, Kundenservice-Aufgaben zu bearbeiten, Bestellungen zu verwalten und Berichte zu erstellen.
      
      Fähigkeiten:
      1. Analyse: Analysieren Sie die Verkaufsleistung mit 'analyze_sales_performance' und 'investigate_shipping_delays'.
      2. Kundenservice: Analysieren Sie Feedback mit 'analyze_customer_sentiment', entwerfen Sie Antworten mit 'draft_customer_response' und bearbeiten Sie Erstattungen mit 'issue_refund'.
      3. Berichterstattung: Fassen Sie Ergebnisse in Zusammenfassungen mit 'generate_yearly_report' zusammen.
      4. Visualisierung: Erstellen Sie Daten-Dashboards für spezifische Metriken mit 'create_operations_dashboard'.
      5. Sub-Agenten: Für komplexe, mehrstufige Marktforschung oder tiefgehende Aufgaben verwenden Sie 'start_ai_agent'.

      Verhalten:
        - Seien Sie proaktiv und umfassend. Wenn Sie nach verspäteten Bestellungen gefragt werden, nutzen Sie 'investigate_shipping_delays' und prüfen Sie proaktiv Bewertungen oder veranlassen Sie gegebenenfalls Erstattungen.
        - WICHTIG: Fragen Sie niemals nach fehlenden Details, um einen Werkzeug-Aufruf abzuschließen, wenn Sie diese ableiten können oder es sich um eine allgemeine Anfrage handelt. Wenn Sie gebeten werden, ein "Dashboard für Verkäufe zu erstellen", nutzen Sie 'analyze_sales_performance', um Daten zu erhalten, und dann 'create_operations_dashboard'.
        - STRIKTE WERKZEUG-NUTZUNG: Wenn der Benutzer ausdrücklich nach einem "Bericht" fragt, MÜSSEN Sie das Werkzeug 'generate_yearly_report' verwenden. Wenn der Benutzer ausdrücklich nach einem "Dashboard" fragt, MÜSSEN Sie das Werkzeug 'create_operations_dashboard' verwenden. Ersetzen Sie das eine nicht durch das andere.
        - Wenn Sie Dashboards mit 'create_operations_dashboard' erstellen, versuchen Sie immer, aggregierte Daten aus Werkzeug-Ergebnissen (wie 'breakdown_by_city', 'monthly_breakdown', 'top_cities_revenue', 'order_status_breakdown' oder 'score_distribution') zu nutzen, um umfangreiche Diagramme mit mehreren Balken/Linien anstelle von Dashboards mit nur einer Metrik zu erstellen.
        - Wenn Sie 'generate_yearly_report' verwenden, nutzen Sie NICHT nur die Gesamtsummen im 'metrics'-Array. Sie MÜSSEN spezifische, detaillierte Metriken (z. B. 'Umsatz im Dezember', 'Bestellungen in Bearbeitung', 'Umsatz der Top-Stadt' usw.) basierend auf den detaillierten Aufschlüsselungsdaten des Werkzeugs einbeziehen, um die Berichtskarten sehr spezifisch auf die Anfrage des Benutzers abzustimmen.
        - WICHTIGE REGEL FÜR LABELS: Verwenden Sie beim Erstellen von Dashboards oder Berichten NIEMALS generische Labels wie "Gesamtumsatz" oder "Gesamtbestellungen", wenn der Benutzer nach einem bestimmten Filter (wie Stadt, Zeitraum oder Kategorie) gefragt hat. Sie MÜSSEN das Label dynamisch ändern, um die genaue Benutzeranfrage und die Daten widerzuspiegeln (z. B. "Umsatz Vianopolis", "Bestellungen Q3 2017", "Gelieferte Bestellungen" usw.). Die Labels müssen klar kommunizieren, welche Daten genau angezeigt werden.
        - Stellen Sie sicher, dass Berichte, die über 'generate_yearly_report' erstellt werden, äußerst umfassend sind. Fügen Sie detaillierte Analysen, spezifische Metrik-Objekte mit Trends und strategische Empfehlungen hinzu. WICHTIG: Verwenden Sie KEINE Markdown-Formatierung (wie **fett**, *kursiv* oder # Überschriften) im 'detailed_analysis'-String für Berichte, halten Sie es in reinem Text.
        - WICHTIGE REGEL FÜR FEHLENDE DATEN: Wenn Sie ein Werkzeug (wie 'analyze_sales_performance') verwenden und es 0 Bestellungen oder 0 Umsatz zurückgibt, dürfen Sie KEINE Daten halluzinieren, erfinden oder schätzen. Informieren Sie den Benutzer ausdrücklich darüber, dass für diesen Zeitraum oder diese Kategorie keine Daten verfügbar sind, und erstellen Sie KEINEN Bericht oder Dashboard. Beachten Sie, dass die verfügbare Datenbank nur Datensätze aus den Jahren 2017 und 2018 enthält.
      - Fassen Sie sich in Textantworten kurz, aber nutzen Sie Werkzeuge intensiv, um Ihre fortgeschrittenen analytischen Fähigkeiten und vielseitigen Berichtsfunktionen zu demonstrieren.
      - Erklären Sie kurz, was Sie tun (z. B. "Analysiere Q3-Verkaufsdaten...", "Entwerfe Kundenantwort...", "Bearbeite Erstattung...").
      - Wenn Sie generate_yearly_report oder create_operations_dashboard aufrufen, geben Sie danach keinen Konversationstext mehr aus.
      - ANTWORTEN SIE IMMER AUF DEUTSCH.
      `,
  };

  let currentHistory = [...history];
  const userMsg: ChatMessage = { role: "user", parts: [{ text: newMessage }], timestamp: new Date() };
  currentHistory.push(userMsg);
  
  let steps: AgentStep[] = [];
  let keepGoing = true;
  let maxSteps = 5;
  let stepCount = 0;
  let finalFullText = "";
  const totalStartTime = performance.now();

  const notify = (isDone: boolean = false, text: string = "") => {
    onUpdate({
      history: currentHistory,
      steps: [...steps],
      isDone,
      currentText: text
    });
  };

  try {
    let lastAggregatedParts: any[] = [];
    while (keepGoing && stepCount < maxSteps) {
      stepCount++;
      
      let responseStream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents: contents,
        config: config
      });

      let turnText = "";
      let functionCalls: any[] = [];
      let aggregatedParts: any[] = [];
      let lastChunkResponse: any = null;

      // Create a text step for this stream turn if it's the final or if it produces text
      const textStepId = Math.random().toString();
      let hasAddedTextStep = false;
      const turnStartTime = performance.now();

      for await (const chunk of responseStream) {
        lastChunkResponse = chunk;
        if (chunk.candidates?.[0]?.content?.parts) {
            aggregatedParts.push(...chunk.candidates[0].content.parts);
        }
        if (chunk.text) {
          if (!hasAddedTextStep) {
            steps.push({ id: textStepId, type: 'text', content: "", status: 'streaming' });
            hasAddedTextStep = true;
          }
          turnText += chunk.text;
          const stepIndex = steps.findIndex(s => s.id === textStepId);
          if (stepIndex > -1) {
            steps[stepIndex].content = turnText;
          }
          finalFullText += chunk.text;
          notify(false, finalFullText);
        }
        if (chunk.functionCalls) {
          functionCalls.push(...chunk.functionCalls);
        }
      }

      lastAggregatedParts = aggregatedParts;

      const turnEndTime = performance.now();

      if (hasAddedTextStep) {
        const stepIndex = steps.findIndex(s => s.id === textStepId);
        if (stepIndex > -1) {
          steps[stepIndex].status = 'completed';
          steps[stepIndex].latencyMs = turnEndTime - turnStartTime;
        }
        notify(false, finalFullText);
      }

      // Reconstruct full response candidate for history appending
      if (aggregatedParts.length > 0 && functionCalls.length > 0) {
          // If we had function calls, append them back to contents
          // The SDK requires passing back what the model outputted
          contents.push({
              role: "model",
              parts: aggregatedParts
          });

          const toolResults = [];

          for (const call of functionCalls) {
            const stepId = call.id || Math.random().toString();
            steps.push({
              id: stepId,
              type: 'tool',
              toolName: call.name,
              toolArgs: call.args,
              status: 'streaming'
            });
            notify(false, finalFullText);

            const toolStartTime = performance.now();
            let output: any = { success: true };
            
            if (call.name === "analyze_sales_performance") {
              const yearMatch = call.args.date_range ? String(call.args.date_range).match(/\d{4}/) : null;
              const year = yearMatch ? yearMatch[0] : "";
              const relevantOrders = MOCK_DB.orders.filter(o => {
                const matchesYear = !year || (o.date && o.date.startsWith(year));
                const matchesCity = !call.args.city || (o.city && o.city.toLowerCase() === String(call.args.city).toLowerCase());
                return matchesYear && matchesCity;
              });
              const totalRevenue = relevantOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
              const totalOrders = relevantOrders.length;
              
              const monthlyBreakdown = relevantOrders.reduce((acc: any, order) => {
                const date = new Date(order.date);
                const month = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
                if (!acc[month]) acc[month] = { revenue: 0, orders: 0 };
                acc[month].revenue += order.amount || 0;
                acc[month].orders += 1;
                return acc;
              }, {});

              const formattedMonthly = Object.entries(monthlyBreakdown).map(([month, stats]: any) => ({
                month,
                revenue: Math.round(stats.revenue * 100) / 100,
                orders: stats.orders
              }));

              const cityBreakdown = relevantOrders.reduce((acc: any, order) => {
                const city = order.city || 'unknown';
                if (!acc[city]) acc[city] = { revenue: 0, orders: 0 };
                acc[city].revenue += order.amount || 0;
                acc[city].orders += 1;
                return acc;
              }, {});

              const topCities = Object.entries(cityBreakdown)
                .map(([city, stats]: any) => ({ city, revenue: Math.round(stats.revenue * 100) / 100, orders: stats.orders }))
                .sort((a: any, b: any) => b.revenue - a.revenue)
                .slice(0, 10);
                
              const statusBreakdown = relevantOrders.reduce((acc: any, order) => {
                const status = order.status || 'unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
              }, {});

              const data = { 
                revenue: Math.round(totalRevenue * 100) / 100, 
                orders: totalOrders,
                monthly_breakdown: formattedMonthly,
                top_cities_revenue: topCities,
                order_status_breakdown: statusBreakdown
              };
              output = { success: true, message: `Verkaufsdaten für ${call.args.date_range} abgerufen`, data };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "investigate_shipping_delays") {
              const delayedOrders = MOCK_DB.orders.filter(o => o.status === "Delayed" && (!call.args.region || o.city === call.args.region));
              
              const cityBreakdown = delayedOrders.reduce((acc: any, order) => {
                acc[order.city] = (acc[order.city] || 0) + 1;
                return acc;
              }, {});

              const topDelayedCities = Object.entries(cityBreakdown)
                .map(([city, count]) => ({ city, count }))
                .sort((a: any, b: any) => b.count - a.count)
                .slice(0, 5);

              output = { 
                success: true, 
                message: `${delayedOrders.length} verspätete Bestellungen gefunden.`, 
                total_delayed: delayedOrders.length,
                breakdown_by_city: topDelayedCities,
                data: delayedOrders.slice(0, 10)
              };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "analyze_customer_sentiment") {
              let relevantReviews = MOCK_DB.reviews;
              if (call.args.product_category) {
                relevantReviews = relevantReviews.filter(r => r.product_category === call.args.product_category);
              }
              if (call.args.score_filter) {
                relevantReviews = relevantReviews.filter(r => r.score === call.args.score_filter);
              }
              
              const scoreDistribution = relevantReviews.reduce((acc: any, rev) => {
                acc[`${rev.score}_star`] = (acc[`${rev.score}_star`] || 0) + 1;
                return acc;
              }, {});

              output = { 
                success: true, 
                message: `${relevantReviews.length} Bewertungen abgerufen.`, 
                score_distribution: scoreDistribution,
                data: relevantReviews.slice(0, 10).map(r => {
                  const order = MOCK_DB.orders.find(o => o.order_id === r.order_id);
                  return { ...r, order_amount: order ? order.amount : undefined };
                })
              };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "issue_refund") {
              let order = MOCK_DB.orders.find((o: any) => o.order_id === call.args.order_id);
              if (order) {
                order.status = "Refunded";
                output = { success: true, message: `Erstattung von $${call.args.refund_amount} für Bestellung ${call.args.order_id} veranlasst.` };
              } else {
                output = { success: false, message: `Bestellung ${call.args.order_id} nicht gefunden.` };
              }
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "draft_customer_response") {
              MOCK_DB.customer_responses.push(call.args);
              output = { success: true, message: `Antwortentwurf für Kunde ${call.args.customer_id} gespeichert.` };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "generate_yearly_report") {
              MOCK_DB.reports.push(call.args);
              output = { success: true, message: "Bericht erstellt", reportId: MOCK_DB.reports.length };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "create_operations_dashboard") {
              MOCK_DB.dashboards.push(call.args);
              output = { success: true, message: "Dashboard erstellt", dashboardId: MOCK_DB.dashboards.length };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "start_ai_agent") {
              try {
                const startAiTask = performance.now();
                const subAgentResponse = await ai.models.generateContent({
                  model: MODEL_NAME,
                  contents: [
                    { role: "user", parts: [{ text: `Du bist ein autonomer Sub-Agent namens ${call.args.agent_name}. Deine Aufgabe ist: ${call.args.task_description}. Gib dein Endergebnis oder deinen Bericht zurück.` }] }
                  ]
                });
                const resultText = subAgentResponse.text;
                const endAiTask = performance.now();
                const latency = endAiTask - startAiTask;
                MOCK_DB.agents.push({ name: call.args.agent_name, task: call.args.task_description, result: resultText, latencyMs: latency });
                output = { success: true, message: "Agent hat Aufgabe abgeschlossen", result: resultText, latencyMs: latency };
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            }

            const toolEndTime = performance.now();

            const stepIndex = steps.findIndex(s => s.id === stepId);
            if (stepIndex > -1) {
              steps[stepIndex].status = 'completed';
              steps[stepIndex].result = output;
              steps[stepIndex].latencyMs = toolEndTime - toolStartTime;
            }
            notify(false, finalFullText);

            toolResults.push({
              name: call.name,
              result: output
            });
          }

          if (toolResults.length > 0) {
              const functionResponseParts = toolResults.map(tr => ({
                  functionResponse: {
                      name: tr.name,
                      response: tr.result
                  }
              }));
              
              contents.push({
                  role: "user",
                  parts: functionResponseParts
              });
          } else {
              keepGoing = false;
          }
      } else {
        keepGoing = false;
      }
    }

    const generatedReport = steps.some(s => s.type === 'tool' && s.toolName === "generate_yearly_report");
    const generatedDashboard = steps.some(s => s.type === 'tool' && s.toolName === "create_operations_dashboard");

    const modelMsg: ChatMessage = {
      role: "model",
      parts: lastAggregatedParts.length > 0 ? lastAggregatedParts : [{ text: finalFullText || "" }],
      timestamp: new Date(),
      latencyMs: performance.now() - totalStartTime,
      hasReport: generatedReport,
      hasDashboard: generatedDashboard
    };
    currentHistory.push(modelMsg);
    
    notify(true, "");

  } catch (error: any) {
    console.error("Agent Error:", error);
    const errorMsg: ChatMessage = {
      role: "model",
      parts: [{ text: `Bei der Verarbeitung Ihrer Anfrage ist ein Fehler aufgetreten: ${error?.message || error}. Bitte versuchen Sie es erneut.` }],
      timestamp: new Date(),
      latencyMs: performance.now() - totalStartTime,
    };
    currentHistory.push(errorMsg);
    notify(true, "");
  }
}

export async function sendMessageToAgent(
  history: ChatMessage[],
  newMessage: string,
  onToolCall?: (toolCall: ToolCall) => void
): Promise<ChatMessage[]> {
  // Convert our internal history format to Gemini's format
  // We need to handle tool responses carefully in a real app, 
  // but for this demo we'll simplify by just sending the text conversation 
  // and letting the model "think" it executed tools via the current turn.
  
  // Actually, to properly demonstrate multi-step, we should use the chat session.
  // However, since we are stateless between calls in this simple function, 
  // we'll instantiate a new chat each time with history.
  
    // We need to map our history to the SDK's Content format
    const sdkHistory = history
      .filter(h => h.role !== 'system') // Filter out system messages if any
      .map(h => {
        const { timestamp, latencyMs, groundingMetadata, ...content } = h;
        return content;
      });
console.log(MODEL_NAME)
    const contents: Content[] = [
      ...sdkHistory,
      { role: "user", parts: [{ text: newMessage }] }
    ];
    
    const config = {
      tools: tools,
      systemInstruction: `Sie sind ein erstklassiger E-Commerce Operations Agent. 
        Ihr Ziel ist es, selbstständig Verkaufsdaten zu analysieren, Kundenservice-Aufgaben zu bearbeiten, Bestellungen zu verwalten und Berichte zu erstellen.
        
        Fähigkeiten:
        1. Analyse: Analysieren Sie die Verkaufsleistung mit 'analyze_sales_performance' und 'investigate_shipping_delays'.
        2. Kundenservice: Analysieren Sie Feedback mit 'analyze_customer_sentiment', entwerfen Sie Antworten mit 'draft_customer_response' und bearbeiten Sie Erstattungen mit 'issue_refund'.
        3. Berichterstattung: Fassen Sie Ergebnisse in Zusammenfassungen mit 'generate_yearly_report' zusammen.
        4. Visualisierung: Erstellen Sie Daten-Dashboards für spezifische Metriken mit 'create_operations_dashboard'.
        5. Sub-Agenten: Für komplexe, mehrstufige Marktforschung oder tiefgehende Aufgaben verwenden Sie 'start_ai_agent'.
  
        Verhalten:
        - Seien Sie proaktiv und umfassend. Wenn Sie nach verspäteten Bestellungen gefragt werden, nutzen Sie 'investigate_shipping_delays' und prüfen Sie proaktiv Bewertungen oder veranlassen Sie gegebenenfalls Erstattungen.
        - WICHTIG: Fragen Sie niemals nach fehlenden Details, um einen Werkzeug-Aufruf abzuschließen, wenn Sie diese ableiten können oder es sich um eine allgemeine Anfrage handelt. Wenn Sie gebeten werden, ein "Dashboard für Verkäufe zu erstellen", nutzen Sie 'analyze_sales_performance', um Daten zu erhalten, und dann 'create_operations_dashboard'.
        - STRIKTE WERKZEUG-NUTZUNG: Wenn der Benutzer ausdrücklich nach einem "Bericht" fragt, MÜSSEN Sie das Werkzeug 'generate_yearly_report' verwenden. Wenn der Benutzer ausdrücklich nach einem "Dashboard" fragt, MÜSSEN Sie das Werkzeug 'create_operations_dashboard' verwenden. Ersetzen Sie das eine nicht durch das andere.
        - Wenn Sie Dashboards mit 'create_operations_dashboard' erstellen, versuchen Sie immer, aggregierte Daten aus Werkzeug-Ergebnissen (wie 'breakdown_by_city', 'monthly_breakdown', 'top_cities_revenue', 'order_status_breakdown' oder 'score_distribution') zu nutzen, um umfangreiche Diagramme mit mehreren Balken/Linien anstelle von Dashboards mit nur einer Metrik zu erstellen.
        - Wenn Sie 'generate_yearly_report' verwenden, nutzen Sie NICHT nur die Gesamtsummen im 'metrics'-Array. Sie MÜSSEN spezifische, detaillierte Metriken (z. B. 'Umsatz im Dezember', 'Bestellungen in Bearbeitung', 'Umsatz der Top-Stadt' usw.) basierend auf den detaillierten Aufschlüsselungsdaten des Werkzeugs einbeziehen, um die Berichtskarten sehr spezifisch auf die Anfrage des Benutzers abzustimmen.
        - WICHTIGE REGEL FÜR LABELS: Verwenden Sie beim Erstellen von Dashboards oder Berichten NIEMALS generische Labels wie "Gesamtumsatz" oder "Gesamtbestellungen", wenn der Benutzer nach einem bestimmten Filter (wie Stadt, Zeitraum oder Kategorie) gefragt hat. Sie MÜSSEN das Label dynamisch ändern, um die genaue Benutzeranfrage und die Daten widerzuspiegeln (z. B. "Umsatz Vianopolis", "Bestellungen Q3 2017", "Gelieferte Bestellungen" usw.). Die Labels müssen klar kommunizieren, welche Daten genau angezeigt werden.
        - Stellen Sie sicher, dass Berichte, die über 'generate_yearly_report' erstellt werden, äußerst umfassend sind. Fügen Sie detaillierte Analysen, spezifische Metrik-Objekte mit Trends und strategische Empfehlungen hinzu. WICHTIG: Verwenden Sie KEINE Markdown-Formatierung (wie **fett**, *kursiv* oder # Überschriften) im 'detailed_analysis'-String für Berichte, halten Sie es in reinem Text.
        - WICHTIGE REGEL FÜR FEHLENDE DATEN: Wenn Sie ein Werkzeug (wie 'analyze_sales_performance') verwenden und es 0 Bestellungen oder 0 Umsatz zurückgibt, dürfen Sie KEINE Daten halluzinieren, erfinden oder schätzen. Informieren Sie den Benutzer ausdrücklich darüber, dass für diesen Zeitraum oder diese Kategorie keine Daten verfügbar sind, und erstellen Sie KEINEN Bericht oder Dashboard. Beachten Sie, dass die verfügbare Datenbank nur Datensätze aus den Jahren 2017 und 2018 enthält.
        - WICHTIGE REGEL FÜR ANTWORTEN: Verwenden Sie NIEMALS die Wörter "erfinden", "fälschen", "Dummy", "realistische Daten generieren" oder "ausgedacht" in Ihrer Textantwort an den Benutzer. Sprechen Sie immer so mit dem Benutzer, als ob die Daten, die Sie abgerufen, verarbeitet oder generiert haben, zu 100 % echt sind und bereits in der Datenbank existierten. Seien Sie selbstbewusst und professionell.
        - Fassen Sie sich in Textantworten kurz, aber nutzen Sie Werkzeuge intensiv, um Ihre fortgeschrittenen analytischen Fähigkeiten und vielseitigen Berichtsfunktionen zu demonstrieren.
        - Erklären Sie kurz, was Sie tun (z. B. "Analysiere Q3-Verkaufsdaten...", "Entwerfe Kundenantwort...", "Bearbeite Erstattung...").
        - Wenn Sie generate_yearly_report oder create_operations_dashboard aufrufen, geben Sie danach keinen Konversationstext mehr aus.
        - ANTWORTEN SIE IMMER AUF DEUTSCH.
        `,
    };

  
  let currentHistory = [...history];
  const totalStartTime = performance.now();
  
  // Add user message to history for the UI
  const userMsg: ChatMessage = { role: "user", parts: [{ text: newMessage }], timestamp: new Date() };
  currentHistory.push(userMsg);

  // Send message
  try {
    // Start the turn
    let result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: config
    });

    // Loop for tool calls
    // The SDK might handle some, but often we need to check `functionCalls`
    
    let keepGoing = true;
    let maxSteps = 5;
    let step = 0;
    const allToolCallRecords: ToolCall[] = [];

    while (keepGoing && step < maxSteps) {
      step++;
      const response = result; // result IS the response
      
      // Check for function calls
      const functionCalls = response.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
        // We have tool calls
        
        // Append the model's function calls to contents so the model has the context
        if (response.candidates && response.candidates[0].content) {
            contents.push(response.candidates[0].content);
        }

        const toolResults = [];
        const toolCallRecords: ToolCall[] = [];

        for (const call of functionCalls) {
          console.log("Tool Call:", call.name, call.args);
          
          // Notify UI
          const toolCallRecord: ToolCall = {
            id: call.id || Math.random().toString(), // SDK might not always give ID in all versions
            name: call.name,
            args: call.args as any,
          };
          toolCallRecords.push(toolCallRecord);
          allToolCallRecords.push(toolCallRecord);
          if (onToolCall) onToolCall(toolCallRecord);

          // Execute Tool
          let output: any = { success: true };
          
          if (call.name === "analyze_sales_performance") {
            const yearMatch = call.args.date_range ? String(call.args.date_range).match(/\d{4}/) : null;
            const year = yearMatch ? yearMatch[0] : "";
            const relevantOrders = MOCK_DB.orders.filter(o => {
              const matchesYear = !year || (o.date && o.date.startsWith(year));
              const matchesCity = !call.args.city || (o.city && o.city.toLowerCase() === String(call.args.city).toLowerCase());
              return matchesYear && matchesCity;
            });
            const totalRevenue = relevantOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
            const totalOrders = relevantOrders.length;
            
            const monthlyBreakdown = relevantOrders.reduce((acc: any, order) => {
              const date = new Date(order.date);
              const month = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
              if (!acc[month]) acc[month] = { revenue: 0, orders: 0 };
              acc[month].revenue += order.amount || 0;
              acc[month].orders += 1;
              return acc;
            }, {});

            const formattedMonthly = Object.entries(monthlyBreakdown).map(([month, stats]: any) => ({
              month,
              revenue: Math.round(stats.revenue * 100) / 100,
              orders: stats.orders
            }));

            const cityBreakdown = relevantOrders.reduce((acc: any, order) => {
              const city = order.city || 'unknown';
              if (!acc[city]) acc[city] = { revenue: 0, orders: 0 };
              acc[city].revenue += order.amount || 0;
              acc[city].orders += 1;
              return acc;
            }, {});

            const topCities = Object.entries(cityBreakdown)
              .map(([city, stats]: any) => ({ city, revenue: Math.round(stats.revenue * 100) / 100, orders: stats.orders }))
              .sort((a: any, b: any) => b.revenue - a.revenue)
              .slice(0, 10);
              
            const statusBreakdown = relevantOrders.reduce((acc: any, order) => {
              const status = order.status || 'unknown';
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {});

            const data = { 
              revenue: Math.round(totalRevenue * 100) / 100, 
              orders: totalOrders,
              monthly_breakdown: formattedMonthly,
              top_cities_revenue: topCities,
              order_status_breakdown: statusBreakdown
            };
            output = { success: true, message: `Verkaufsdaten für ${call.args.date_range} abgerufen`, data };
          } else if (call.name === "investigate_shipping_delays") {
            const delayedOrders = MOCK_DB.orders.filter(o => o.status === "Delayed" && (!call.args.region || o.city === call.args.region));
            
            const cityBreakdown = delayedOrders.reduce((acc: any, order) => {
              acc[order.city] = (acc[order.city] || 0) + 1;
              return acc;
            }, {});

            const topDelayedCities = Object.entries(cityBreakdown)
              .map(([city, count]) => ({ city, count }))
              .sort((a: any, b: any) => b.count - a.count)
              .slice(0, 5);

            output = { 
              success: true, 
              message: `${delayedOrders.length} verspätete Bestellungen gefunden.`, 
              total_delayed: delayedOrders.length,
              breakdown_by_city: topDelayedCities,
              data: delayedOrders.slice(0, 10)
            };
          } else if (call.name === "analyze_customer_sentiment") {
            let relevantReviews = MOCK_DB.reviews;
            if (call.args.product_category) {
              relevantReviews = relevantReviews.filter(r => r.product_category === call.args.product_category);
            }
            if (call.args.score_filter) {
              relevantReviews = relevantReviews.filter(r => r.score === call.args.score_filter);
            }
            
            const scoreDistribution = relevantReviews.reduce((acc: any, rev) => {
              acc[`${rev.score}_star`] = (acc[`${rev.score}_star`] || 0) + 1;
              return acc;
            }, {});

            output = { 
              success: true, 
              message: `${relevantReviews.length} Bewertungen abgerufen.`, 
              score_distribution: scoreDistribution,
              data: relevantReviews.slice(0, 10) 
            };
          } else if (call.name === "issue_refund") {
            let order = MOCK_DB.orders.find((o: any) => o.order_id === call.args.order_id);
            if (order) {
              order.status = "Refunded";
              output = { success: true, message: `Erstattung von $${call.args.refund_amount} für Bestellung ${call.args.order_id} veranlasst.` };
            } else {
              output = { success: false, message: `Bestellung ${call.args.order_id} nicht gefunden.` };
            }
          } else if (call.name === "draft_customer_response") {
            MOCK_DB.customer_responses.push(call.args);
            output = { success: true, message: `Antwortentwurf für Kunde ${call.args.customer_id} gespeichert.` };
          } else if (call.name === "generate_yearly_report") {
            MOCK_DB.reports.push(call.args);
            output = { success: true, message: "Bericht erstellt", reportId: MOCK_DB.reports.length };
          } else if (call.name === "create_operations_dashboard") {
            MOCK_DB.dashboards.push(call.args);
            output = { success: true, message: "Dashboard erstellt", dashboardId: MOCK_DB.dashboards.length };
          } else if (call.name === "start_ai_agent") {
            try {
              // Create an autonomous sub-agent call
              const startAiTask = performance.now();
              const subAgentResponse = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: [
                  { role: "user", parts: [{ text: `Du bist ein autonomer Sub-Agent namens ${call.args.agent_name}. Deine Aufgabe ist: ${call.args.task_description}. Gib dein Endergebnis oder deinen Bericht zurück.` }] }
                ]
              });
              const resultText = subAgentResponse.text;
              const latency = performance.now() - startAiTask;
              MOCK_DB.agents.push({ name: call.args.agent_name, task: call.args.task_description, result: resultText, latencyMs: latency });
              output = { success: true, message: "Agent hat Aufgabe abgeschlossen", result: resultText, latencyMs: latency };
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          }

          
          toolResults.push({
            id: call.id, // Must match the call ID
            name: call.name,
            result: output
          });
        }

        // Send results back to model
        // If we have function calls, we MUST send the response back
        if (toolResults.length > 0) {
            // Construct the tool response parts
            const functionResponseParts = toolResults.map(tr => ({
                functionResponse: {
                    name: tr.name,
                    response: tr.result
                }
            }));
            
            contents.push({
                role: "user",
                parts: functionResponseParts
            });
            
            result = await ai.models.generateContent({
              model: MODEL_NAME,
              contents: contents,
              config: config
            });
        } else {
            keepGoing = false;
        }

      } else {
        // No function calls, just text
        keepGoing = false;
      }
    }

    // Check if report or dashboard was generated during this turn
    const generatedReport = allToolCallRecords.some(t => t.name === "generate_yearly_report");
    const generatedDashboard = allToolCallRecords.some(t => t.name === "create_operations_dashboard");

    // Final response from model
    const modelMsg: ChatMessage = {
      role: "model",
      parts: [{ text: result.text || "" }],
      timestamp: new Date(),
      groundingMetadata: result.candidates?.[0]?.groundingMetadata,
      latencyMs: performance.now() - totalStartTime,
      hasReport: generatedReport,
      hasDashboard: generatedDashboard
    };
    currentHistory.push(modelMsg);
    
    return currentHistory;

  } catch (error) {
    console.error("Agent Error:", error);
    const errorMsg: ChatMessage = {
      role: "model",
      parts: [{ text: "Bei der Verarbeitung Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut." }],
      timestamp: new Date(),
      latencyMs: performance.now() - totalStartTime,
    };
    currentHistory.push(errorMsg);
    return currentHistory;
  }
}
