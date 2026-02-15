export const HEARTBEAT_STALE_MS = 90_000;

export function isHeartbeatFresh(lastSeen: Date | null | undefined, now: Date = new Date()): boolean {
  if (!lastSeen) return false;
  return now.getTime() - lastSeen.getTime() <= HEARTBEAT_STALE_MS;
}

export function resolveStrictStatus(isInsideZone: boolean, lastSeen: Date | null | undefined, now: Date = new Date()): "ON_SITE" | "OFF_SITE" {
  return isInsideZone && isHeartbeatFresh(lastSeen, now) ? "ON_SITE" : "OFF_SITE";
}

export function resolveOpenSessionEnd(lastSeen: Date | null | undefined, now: Date = new Date()): Date {
  if (!lastSeen) return now;
  if (isHeartbeatFresh(lastSeen, now)) return now;
  return lastSeen.getTime() < now.getTime() ? lastSeen : now;
}
