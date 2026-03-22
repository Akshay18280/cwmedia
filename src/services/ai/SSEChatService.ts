import type { SourceChunk, QueryMetrics, PipelineStep } from '@/components/ai/types';

interface StreamCallbacks {
  model?: string;
  onStep: (step: PipelineStep) => void;
  onToken: (text: string) => void;
  onSources: (sources: SourceChunk[]) => void;
  onMetrics: (metrics: QueryMetrics) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export function streamChat(
  apiBase: string,
  question: string,
  callbacks: StreamCallbacks,
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${apiBase}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, ...(callbacks.model ? { model: callbacks.model } : {}) }),
        signal: controller.signal,
      });

      if (!res.ok) {
        callbacks.onError(`HTTP ${res.status}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        callbacks.onError('No readable stream');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              switch (currentEvent) {
                case 'step':
                  callbacks.onStep(parsed);
                  break;
                case 'token':
                  callbacks.onToken(parsed.text);
                  break;
                case 'sources':
                  callbacks.onSources(parsed);
                  break;
                case 'metrics':
                  callbacks.onMetrics(parsed);
                  break;
                case 'done':
                  callbacks.onDone();
                  break;
                case 'error': {
                  const errMsg = parsed.message || 'Unknown error';
                  const code = parsed.code as string | undefined;
                  if (code === 'limit_reached' || /rate.limit|limit.reached/i.test(errMsg)) {
                    callbacks.onError('Model rate limit reached. Try switching to a different model or wait a moment.');
                  } else {
                    callbacks.onError(errMsg);
                  }
                  break;
                }
              }
            } catch {
              // Skip malformed JSON
            }
            currentEvent = '';
          }
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        callbacks.onError(err instanceof Error ? err.message : 'Stream failed');
      }
    }
  })();

  return controller;
}
