export type ApiErrorPayload = {
  code: string;
  message: string;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
};

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data } satisfies ApiResponse<T>, { status });
}

export function fail(code: string, message: string, status = 400): Response {
  return Response.json(
    {
      success: false,
      error: { code, message },
    } satisfies ApiResponse,
    { status }
  );
}
