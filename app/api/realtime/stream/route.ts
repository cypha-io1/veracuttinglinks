import { subscribeRealtime, type RealtimeChannel } from '@/lib/realtime';

export const runtime = 'nodejs';

function parseChannels(raw: string | null): Set<RealtimeChannel> {
  const channels = new Set<RealtimeChannel>();
  const accepted: RealtimeChannel[] = ['products', 'orders', 'categories'];

  if (!raw) {
    for (const channel of accepted) {
      channels.add(channel);
    }

    return channels;
  }

  for (const part of raw.split(',')) {
    const channel = part.trim() as RealtimeChannel;
    if (accepted.includes(channel)) {
      channels.add(channel);
    }
  }

  if (channels.size === 0) {
    for (const channel of accepted) {
      channels.add(channel);
    }
  }

  return channels;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channels = parseChannels(searchParams.get('channels'));

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send('ready', { ok: true, channels: Array.from(channels) });

      const unsubscribe = subscribeRealtime(payload => {
        if (!channels.has(payload.channel)) {
          return;
        }

        send('message', payload);
      });

      const keepAlive = setInterval(() => {
        send('ping', { t: Date.now() });
      }, 15_000);

      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
