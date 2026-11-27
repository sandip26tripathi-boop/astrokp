/**
 * lib/resilientFetch.ts
 * Autonomous Exponential Backoff Fetch Wrapper for VedicWisdom
 * Ensures zero silent failures on transient network drops or API rate limiting
 */

export interface ResilientFetchOptions extends RequestInit {
  retries?: number;
  backoffMs?: number;
  timeoutMs?: number;
}

export async function resilientFetch(
  url: string,
  options: ResilientFetchOptions = {}
): Promise<Response> {
  const { retries = 3, backoffMs = 500, timeoutMs = 25000, ...fetchOptions } = options;

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Merge external signal if passed
    if (fetchOptions.signal) {
      fetchOptions.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Retry on server temporary glitches (502, 503, 504) or rate limit (429)
      if ((response.status >= 502 && response.status <= 504) || response.status === 429) {
        if (attempt < retries) {
          const delay = backoffMs * Math.pow(2, attempt) + Math.random() * 200;
          console.warn(
            `[ResilientFetch] HTTP ${response.status} on ${url}. Retrying in ${Math.round(delay)}ms (Attempt ${attempt + 1}/${retries})...`
          );
          await new Promise((r) => setTimeout(r, delay));
          attempt++;
          continue;
        }
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      // Don't retry if manually aborted by the caller
      if (err?.name === 'AbortError' && fetchOptions.signal?.aborted) {
        throw err;
      }

      if (attempt < retries) {
        const delay = backoffMs * Math.pow(2, attempt) + Math.random() * 200;
        console.warn(
          `[ResilientFetch] Network error on ${url}: ${err?.message || err}. Retrying in ${Math.round(delay)}ms (Attempt ${attempt + 1}/${retries})...`
        );
        await new Promise((r) => setTimeout(r, delay));
        attempt++;
      } else {
        break;
      }
    }
  }

  throw lastError || new Error(`Failed to fetch from ${url} after ${retries} attempts.`);
}
