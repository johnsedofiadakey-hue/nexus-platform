import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Debug SSE stream: allows connecting with `x-debug-user` header when
// DEBUG_SSE_ALLOW=true. This is for local debugging only.
export async function GET(req: Request) {
  if (process.env.DEBUG_SSE_ALLOW !== 'true') {
    return new Response('Debug SSE disabled', { status: 403 });
  }

  const uid = req.headers.get('x-debug-user');
  if (!uid) return new Response('Missing x-debug-user header', { status: 400 });

  const me = await prisma.user.findUnique({ where: { id: uid }, select: { id: true } });
  if (!me) return new Response('User not found', { status: 404 });

  const url = new URL(req.url);
  const otherId = url.searchParams.get('staffId');
  const sinceParam = url.searchParams.get('since');
  let last = sinceParam ? new Date(sinceParam) : new Date(0);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (obj: any) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)); } catch (e) {}
      };

      try {
        const whereClause: any = otherId ? {
          OR: [ { senderId: me.id, receiverId: otherId }, { senderId: otherId, receiverId: me.id } ]
        } : { OR: [ { senderId: me.id }, { receiverId: me.id } ] };

        const initial = await prisma.chatMessage.findMany({ where: whereClause, orderBy: { createdAt: 'asc' } });
        console.log('[DEBUG SSE] initial backlog rows:', initial.length, 'for user', me.id);
        for (const m of initial) { send(m); last = m.createdAt; }
      } catch (e) { console.error('DEBUG SSE initial fetch error', e); }

      const iv = setInterval(async () => {
        if (closed) return;
        try {
          const whereClause: any = otherId ? { AND: [ { createdAt: { gt: last } }, { OR: [ { senderId: me.id, receiverId: otherId }, { senderId: otherId, receiverId: me.id } ] } ] } : { AND: [ { createdAt: { gt: last } }, { OR: [ { senderId: me.id }, { receiverId: me.id } ] } ] };
          const rows = await prisma.chatMessage.findMany({ where: whereClause, orderBy: { createdAt: 'asc' } });
          for (const r of rows) { send(r); last = r.createdAt; console.log('[DEBUG SSE] sending new message id:', r.id); }
        } catch (e) { console.error('DEBUG SSE poll error', e); }
      }, 1500);

      const abortHandler = () => { closed = true; clearInterval(iv); try { controller.close(); } catch (e) {} };
      req.signal.addEventListener('abort', abortHandler);
    },
    cancel() {}
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } });
}
