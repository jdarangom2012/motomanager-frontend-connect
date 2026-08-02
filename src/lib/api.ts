/**
 * Cliente HTTP para la API real de MotoManager (Django + DRF + JWT).
 * Contrato: docs/05_OpenAPI/openapi.yaml
 *
 * El backend corre en la maquina del usuario (http://localhost:8000/api/v1),
 * por eso todas las llamadas se hacen desde el navegador (nunca en SSR).
 */

const DEFAULT_BASE = "http://localhost:8000/api/v1";
const BASE_KEY = "mm.api_base";
const ACCESS_KEY = "mm.access";
const REFRESH_KEY = "mm.refresh";
const USER_KEY = "mm.user";

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(BASE_KEY);
    if (stored) return stored.replace(/\/+$/, "");
  }
  const env = import.meta.env["VITE_API_BASE_URL"] as string | undefined;
  return (env || DEFAULT_BASE).replace(/\/+$/, "");
}

export function setApiBase(base: string) {
  window.localStorage.setItem(BASE_KEY, base.replace(/\/+$/, ""));
}

export const tokens = {
  get access() {
    return typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const USER_STORAGE_KEY = USER_KEY;

export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string[]>;
  constructor(status: number, code: string, message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.code = code;
    if (fieldErrors) this.fieldErrors = fieldErrors;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  auth?: boolean;
  signal?: AbortSignal;
};

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokens.refresh;
  if (!refresh) return null;
  try {
    const res = await fetch(`${getApiBase()}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access: string };
    tokens.set(data.access);
    return data.access;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true, signal } = options;

  const url = new URL(`${getApiBase()}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }

  const doRequest = async (token: string | null) => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth && token) headers["Authorization"] = `Bearer ${token}`;
    const init: RequestInit = { method, headers };
    if (body !== undefined) init.body = JSON.stringify(body);
    if (signal) init.signal = signal;
    return fetch(url.toString(), init);
  };

  let response: Response;
  try {
    response = await doRequest(auth ? tokens.access : null);
  } catch {
    const desdeHttps =
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      getApiBase().startsWith("http://");
    throw new ApiError(
      0,
      "network_error",
      desdeHttps
        ? `El navegador bloqueo la conexion a ${getApiBase()} desde una pagina HTTPS (Private Network Access). Abre el frontend en http://localhost:8080 o expon el backend por HTTPS.`
        : `No se pudo conectar con la API (${getApiBase()}). Verifica que el backend este corriendo y que permita CORS desde este origen.`,
    );
  }


  if (response.status === 401 && auth && tokens.refresh) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doRequest(newToken);
    }
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    const payload = (data ?? {}) as { code?: string; message?: string; detail?: string; field_errors?: Record<string, string[]> };
    throw new ApiError(
      response.status,
      payload.code ?? `http_${response.status}`,
      payload.message ?? payload.detail ?? `Error ${response.status} en ${path}`,
      payload.field_errors,
    );
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
