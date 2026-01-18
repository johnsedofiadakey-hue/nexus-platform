import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Simple SSE stream that polls the DB for new messages for this conversation.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!me) return new Response('User not found', { status: 404 });

  console.log('[SSE] connected for user', me.id, 'staffId?', new URL(req.url).searchParams.get('staffId'));

  const url = new URL(req.url);
  const otherId = url.searchParams.get('staffId');
  const sinceParam = url.searchParams.get('since');
  let last = sinceParam ? new Date(sinceParam) : new Date(0);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      // Helper to send a single message event
      const send = (obj: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch (e) {
          // ignore
        }
      };

      // Initial backlog
      try {
        const whereClause: any = otherId ? {
          OR: [
            { senderId: me.id, receiverId: otherId },
            { senderId: otherId, receiverId: me.id }
          ]
        } : { OR: [ { senderId: me.id }, { receiverId: me.id } ] };

        const initial = await prisma.chatMessage.findMany({
          where: whereClause,
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, role: true } }, receiver: { select: { id: true, name: true, role: true } } }
        });

        console.log('[SSE] initial backlog rows:', initial.length);
        for (const m of initial) {
          send(m);
          last = m.createdAt;
          console.log('[SSE] sending initial message id:', m.id);
        }
      } catch (e) {
        console.error('SSE initial fetch error', e);
      }

      // Poll loop
      const iv = setInterval(async () => {
        if (closed) return;
        try {
          const whereClause: any = otherId ? {
            AND: [
              { createdAt: { gt: last } },
              { OR: [ { senderId: me.id, receiverId: otherId }, { senderId: otherId, receiverId: me.id } ] }
            ]
          } : { AND: [ { createdAt: { gt: last } }, { OR: [ { senderId: me.id }, { receiverId: me.id } ] } ] };

          const rows = await prisma.chatMessage.findMany({
            where: whereClause,
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { id: true, name: true, role: true } }, receiver: { select: { id: true, name: true, role: true } } }
          });

          for (const r of rows) {
            send(r);
            last = r.createdAt;
            console.log('[SSE] sending new message id:', r.id);
          }
        } catch (e) {
          console.error('SSE poll error', e);
        }
      }, 1500);

      // Handle client disconnect
      const abortHandler = () => {
        closed = true;
        clearInterval(iv);
        try { controller.close(); } catch (e) {}
      };

      req.signal.addEventListener('abort', abortHandler);
    },
    cancel() {
      // noop - abort signal handles cleanup
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
