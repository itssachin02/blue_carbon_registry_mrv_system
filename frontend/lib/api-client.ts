/**
 * API Health Check & Server Status Utility
 * Verifies backend connectivity and provides detailed error messages
 */

interface ServerStatus {
  isOnline: boolean;
  message: string;
  statusCode?: number;
  timestamp: string;
}

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") || "";
}

/**
 * Check if the backend server is running and accessible
 */
export async function checkServerHealth(
  apiUrl?: string,
  timeout: number = 5000
): Promise<ServerStatus> {
  const timestamp = new Date().toISOString();
  const baseUrl = (apiUrl || getApiBaseUrl()).trim().replace(/\/$/, "");
  const url = baseUrl ? `${baseUrl}/` : "/";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        isOnline: true,
        message: "✅ Backend server is running",
        statusCode: response.status,
        timestamp,
      };
    } else {
      return {
        isOnline: false,
        message: `❌ Server returned error code ${response.status}`,
        statusCode: response.status,
        timestamp,
      };
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        isOnline: false,
        message: `❌ Server timeout after ${timeout}ms. Check if the server is running`,
        timestamp,
      };
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        isOnline: false,
        message: baseUrl
          ? `❌ Cannot connect to ${baseUrl}. Make sure the backend or local API is reachable.`
          : "❌ Cannot reach the local application. Make sure the frontend is running.",
        timestamp,
      };
    }

    return {
      isOnline: false,
      message: `❌ Connection error: ${error.message}`,
      timestamp,
    };
  }
}

/**
 * Perform an authenticated API request with error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: Record<string, any>;
    token?: string;
    timeout?: number;
  } = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const {
    method = "GET",
    body,
    token,
    timeout = 10000,
  } = options;

  const apiUrl = getApiBaseUrl();
  const requestUrl = apiUrl
    ? `${apiUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`
    : endpoint;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(requestUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        data?.msg ||
        data?.error ||
        `${method} ${endpoint} failed with status ${response.status}`;

      return {
        data: null,
        error: errorMsg,
        status: response.status,
      };
    }

    return {
      data: data as T,
      error: null,
      status: response.status,
    };
  } catch (error: any) {
    let errorMessage = "Network request failed";

    if (error.name === "AbortError") {
      errorMessage = `Request timeout after ${timeout}ms. Server may be unresponsive.`;
    } else if (error instanceof TypeError) {
      if (error.message.includes("fetch")) {
        errorMessage = `Cannot reach server at ${apiUrl}. Make sure backend is running.`;
      } else {
        errorMessage = error.message;
      }
    } else {
      errorMessage = error.message || "Unknown error occurred";
    }

    console.error("API Request Error:", {
      endpoint,
      method,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    return {
      data: null,
      error: errorMessage,
      status: 0,
    };
  }
}

/**
 * Get detailed debugging information
 */
export function getDebugInfo() {
  return {
    apiUrl: getApiBaseUrl(),
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
    origin: typeof window !== "undefined" ? window.location.origin : "N/A",
  };
}
