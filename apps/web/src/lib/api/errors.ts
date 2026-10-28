import type { ApiError } from "@roy/types";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: ApiError;
  constructor(status: number, body: ApiError) {
    super(body.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
  }
  get details(): string[] {
    return this.body.details ?? [];
  }
}

export function isApiError(e: unknown): e is ApiRequestError {
  return e instanceof ApiRequestError;
}

export async function parseError(res: Response): Promise<ApiRequestError> {
  let body: ApiError = { statusCode: res.status, error: res.statusText, message: "Request failed.", correlationId: res.headers.get("x-correlation-id") ?? "" };
  try {
    const json = (await res.json()) as Partial<ApiError>;
    body = { ...body, ...json };
  } catch {
    /* non-JSON error body */
  }
  return new ApiRequestError(res.status, body);
}
