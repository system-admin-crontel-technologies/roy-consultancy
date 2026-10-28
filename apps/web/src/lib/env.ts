/** Server-side URL of the API (inside Docker: http://api:4000). Never exposed to the browser. */
export const API_INTERNAL_URL = (process.env.API_INTERNAL_URL ?? "http://localhost:4000").replace(/\/$/, "");
export const API_PREFIX = "/api/v1";
