import { withLogContext } from "./logger";
import { AppError } from "./errors";
import { fail } from "./api-response";

export async function withApiErrorHandling<T>(
  req: Request,
  route: string,
  requestId: string,
  fn: () => Promise<Response>
): Promise<Response> {
  const log = withLogContext({ route, requestId });

  try {
    return await fn();
  } catch (error: unknown) {
    if (error instanceof AppError) {
      log.warn({ code: error.code, message: error.message }, "Handled API error");
      return fail(error.code, error.message, error.status);
    }

    log.error({ err: error }, "Unhandled API exception");
    return fail("INTERNAL_ERROR", "An internal error occurred", 500);
  }
}
