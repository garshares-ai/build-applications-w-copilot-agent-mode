// Relative /api paths go through the Vite dev proxy, so port 8000 never needs to be public.
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body: unknown = await response.json();
      if (typeof body === 'object' && body !== null) {
        const detail = 'message' in body ? body.message : 'error' in body ? body.error : undefined;
        if (typeof detail === 'string' && detail.trim()) message = detail;
      }
    } catch {
      // Keep the HTTP status when the server does not return JSON.
    }
    throw new Error(`Unable to load data: ${message}`);
  }
  return response.json() as Promise<T>;
}
