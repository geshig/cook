/** Fire an analytics event if Umami is loaded; silently does nothing otherwise. */
export function track(name: string, data?: Record<string, string | number>) {
  try {
    (window as unknown as { umami?: { track: (n: string, d?: object) => void } }).umami?.track(name, data);
  } catch {
    /* analytics must never break the page */
  }
}
