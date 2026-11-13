import React, { useState } from 'react';
import { Bot, Database, Loader2, Send, User } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
}

const SUGGESTED_QUESTIONS = [
  "What is today's attendance?",
  "What was today's maximum temperature?",
  'Were there any fire alerts?',
  'How many students are absent?',
  'Is the classroom device online?',
  "Show today's emergency events.",
];

export function AIAssistantPage() {
  const { students, attendance, telemetry, telemetrySeries, emergencyEvents, devices, currentUser } = usePlatform();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Ask any question about classroom attendance, temperature, fire/panic alerts, or device status. Responses are strictly grounded in live platform database records — queries outside available data return "No data".',
      timestamp: new Date().toTimeString().slice(0, 8),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const askQuestion = async (questionText: string) => {
    const clean = questionText.trim();
    if (!clean || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: clean,
      timestamp: new Date().toTimeString().slice(0, 8),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const databaseSnapshot = {
        students: students.map((s) => ({ studentId: s.studentId, name: s.name, className: s.className, cardStatus: s.cardStatus })),
        attendance,
        telemetry,
        telemetryHistory: telemetrySeries,
        emergencyEvents,
        devices: devices.map((d) => ({
          id: d.id,
          name: d.name,
          roomId: d.roomId,
          status: d.status,
          firmwareVersion: d.firmwareVersion,
          rssi: d.rssi,
          lastSeen: d.lastSeen,
        })),
      };

      const resp = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: clean, databaseSnapshot }),
      });
      const json = await resp.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: json.answer ?? 'No data',
          timestamp: new Date().toTimeString().slice(0, 8),
          source: json.source,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: 'No data',
          timestamp: new Date().toTimeString().slice(0, 8),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askQuestion(input);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">AI Assistant</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Strictly answers from verified platform database records · Never fabricates classroom metrics
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
          <Database className="w-4 h-4 text-blue-600" />
          <span>Connected to Live Store Snapshot</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col h-[560px] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <span className="font-display text-sm font-semibold">FastRobox Database Query Assistant</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Signed in: {currentUser?.role}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-blue-600'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  <p className={`text-[10px] font-mono mt-1.5 ${m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                    {m.timestamp}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Querying platform database...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about today's attendance, max temperature, fire alerts, or device status..."
              className="flex-1 px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Suggested Questions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 h-fit">
          <h2 className="font-display text-base font-semibold">Suggested Questions</h2>
          <div className="space-y-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => askQuestion(q)}
                className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 text-xs font-medium transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">Anti-Hallucination Policy</p>
            <p>
              Questions outside recorded classroom data (for example, unrelated trivia or unlogged historical dates) return exactly <code className="font-mono font-bold">No data</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
