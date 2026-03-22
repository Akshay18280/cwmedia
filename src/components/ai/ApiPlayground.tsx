import React, { useState } from 'react';
import { Play, Loader2, Clock } from 'lucide-react';
import { appConfig } from '@/config/appConfig';

const ENDPOINTS = [
  { method: 'GET', path: '/api/health', body: null },
  { method: 'GET', path: '/api/metadata', body: null },
  { method: 'GET', path: '/api/documents', body: null },
  { method: 'GET', path: '/api/stats', body: null },
  { method: 'POST', path: '/api/chat', body: '{\n  "question": "How does RAG work?"\n}' },
];

export const ApiPlayground: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [requestBody, setRequestBody] = useState(ENDPOINTS[4].body || '');
  const [response, setResponse] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selected = ENDPOINTS[selectedIdx];
  const apiBase = appConfig.ai.apiBaseUrl;

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    setRequestBody(ENDPOINTS[idx].body || '');
    setResponse(null);
    setStatusCode(null);
    setResponseTime(null);
  };

  const handleSend = async () => {
    setIsLoading(true);
    setResponse(null);
    const start = performance.now();

    try {
      const opts: RequestInit = {
        method: selected.method,
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000),
      };
      if (selected.method === 'POST' && requestBody) {
        opts.body = requestBody;
      }

      const res = await fetch(`${apiBase}${selected.path}`, opts);
      const elapsed = Math.round(performance.now() - start);
      setStatusCode(res.status);
      setResponseTime(elapsed);

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setResponse(JSON.stringify(json, null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err) {
      setStatusCode(0);
      setResponseTime(Math.round(performance.now() - start));
      setResponse(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-medium-contrast bg-medium-contrast/30 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-medium-contrast">
        {/* Request panel */}
        <div className="p-4 space-y-3">
          <h4 className="text-body-sm font-semibold text-high-contrast">Request</h4>

          {/* Endpoint selector */}
          <div className="flex flex-wrap gap-2">
            {ENDPOINTS.map((ep, i) => (
              <button
                key={ep.path}
                onClick={() => handleSelect(i)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                  selectedIdx === i
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-medium-contrast text-low-contrast hover:text-high-contrast'
                }`}
              >
                <span className={`font-mono font-bold ${ep.method === 'POST' ? 'text-orange-400' : 'text-green-400'}`}>
                  {ep.method}
                </span>{' '}
                {ep.path}
              </button>
            ))}
          </div>

          {/* Body editor for POST */}
          {selected.method === 'POST' && (
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="w-full h-28 bg-low-contrast/50 border border-medium-contrast rounded-lg p-3 text-xs font-mono text-high-contrast focus:outline-none focus:ring-2 focus:ring-accent-primary/50 resize-none"
              placeholder="Request body (JSON)"
            />
          )}

          <button
            onClick={handleSend}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-flow text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Send Request
          </button>
        </div>

        {/* Response panel */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-body-sm font-semibold text-high-contrast">Response</h4>
            <div className="flex items-center gap-3">
              {statusCode !== null && (
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded ${
                    statusCode >= 200 && statusCode < 300
                      ? 'bg-green-500/20 text-green-400'
                      : statusCode === 0
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {statusCode === 0 ? 'ERR' : statusCode}
                </span>
              )}
              {responseTime !== null && (
                <span className="text-xs text-low-contrast flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {responseTime}ms
                </span>
              )}
            </div>
          </div>

          <pre className="w-full h-48 bg-low-contrast/50 border border-medium-contrast rounded-lg p-3 text-xs font-mono text-medium-contrast overflow-auto whitespace-pre-wrap">
            {isLoading ? 'Loading...' : response || 'Click "Send Request" to test an endpoint'}
          </pre>
        </div>
      </div>
    </div>
  );
};
