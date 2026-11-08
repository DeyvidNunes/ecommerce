import { ApiError } from "./api-error";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TIMEOUT_MS = 70_000; // a API gratuita pode levar cerca de um minuto para acordar

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, token }: RequestOptions = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL não está definida");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message =
        (Array.isArray(payload?.message)
          ? payload.message.join(", ")
          : payload?.message) ?? `Erro ${response.status}`;
      throw new ApiError(response.status, message, payload);
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(0, "A API demorou demais para responder");
    }
    throw new ApiError(0, "Não foi possível conectar à API");
  } finally {
    clearTimeout(timer);
  }
}
