/**
 * 🕐 FETCH WITH TIMEOUT
 * Utility to prevent hanging fetch requests
 * Automatically aborts requests that take too long
 */

export interface FetchWithTimeoutOptions extends RequestInit {
    timeout?: number; // Timeout in milliseconds (default: 10000)
}

/**
 * Fetch with automatic timeout
 * @param url - URL to fetch
 * @param options - Fetch options including optional timeout
 * @returns Promise<Response>
 * @throws Error if request times out
 */
export async function fetchWithTimeout(
    url: string,
    options: FetchWithTimeoutOptions = {}
): Promise<Response> {
    const { timeout = 10000, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
    }
}

/**
 * Fetch JSON with timeout
 * Convenience wrapper for JSON responses
 */
export async function fetchJSON<T = any>(
    url: string,
    options: FetchWithTimeoutOptions = {}
): Promise<T> {
    const response = await fetchWithTimeout(url, options);
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
}
