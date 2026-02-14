import { z } from "zod";
import { ValidationError } from "./errors";

export async function parseJsonBody<T extends z.ZodTypeAny>(req: Request, schema: T): Promise<z.output<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError("Invalid JSON payload");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message || "Invalid request body");
  }

  return result.data;
}

export function parseQuery<T extends z.ZodTypeAny>(url: URL, schema: T): z.output<T> {
  const queryObj: Record<string, string> = {};
  for (const [k, v] of url.searchParams.entries()) {
    queryObj[k] = v;
  }

  const result = schema.safeParse(queryObj);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message || "Invalid query parameters");
  }

  return result.data;
}
