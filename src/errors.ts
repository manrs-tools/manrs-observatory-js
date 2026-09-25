export interface ManrsErrorDetail {
  message?: string;
  path?: string;
  field?: string;
  location?: string;
  instancePath?: string;
  dataPath?: string;
  [key: string]: unknown;
}

export interface ManrsErrorBody {
  title?: string;
  status?: number;
  detail?: string;
  errors?: ManrsErrorDetail[];
  [key: string]: unknown;
}

/** Raised when the MANRS Observatory API returns an error response. */
export class ManrsError extends Error {
  /** HTTP status code returned by the API (0 if the request never reached the server). */
  readonly statusCode: number;
  /** Parsed JSON response body, if any. */
  readonly body: ManrsErrorBody;

  constructor(message: string, statusCode = 0, body: ManrsErrorBody = {}) {
    super(message);
    this.name = "ManrsError";
    this.statusCode = statusCode;
    this.body = body;
    Object.setPrototypeOf(this, ManrsError.prototype);
  }
}

export function errorMessageFromBody(body: ManrsErrorBody, statusCode: number): string {
  const detail = body.detail || body.title || "";
  let message = detail ? `${detail} (HTTP ${statusCode})` : `HTTP ${statusCode}`;

  const errors = body.errors ?? [];
  if (errors.length > 0) {
    const parts = errors.map((e) => {
      const path = e.path || e.field || e.location || e.instancePath || e.dataPath;
      if (e.message && path) return `${e.message} (at ${String(path)})`;
      if (e.message) return e.message;
      if (path) return String(path);
      return JSON.stringify(e);
    });
    message += ": " + parts.join("; ");
  }

  return message;
}
