/**
 * API utility functions for the Fraud Investigation System.
 */

const API_BASE = '/api';

/**
 * Fetch wrapper with error handling.
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }

  return response.json();
}

// Transaction API
export async function fetchTransactions(params?: {
  page?: number;
  page_size?: number;
  is_fraud?: boolean;
  merchant_category?: string;
  min_amount?: number;
  max_amount?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
  }
  const query = searchParams.toString();
  return fetchApi(`/transactions${query ? `?${query}` : ''}`);
}

export async function fetchTransaction(transactionId: string) {
  return fetchApi(`/transactions/${transactionId}`);
}

// Metrics API
export async function fetchMetrics() {
  return fetchApi('/metrics');
}

// Fraud rings API
export async function fetchFraudRings() {
  return fetchApi('/fraud-rings');
}

// Network data API
export async function fetchNetworkData(edgeLimit: number = 500) {
  return fetchApi(`/network-data?edge_limit=${edgeLimit}`);
}

// Statistics API
export async function fetchHourlyStats() {
  return fetchApi('/stats/hourly');
}

export async function fetchDailyStats() {
  return fetchApi('/stats/daily');
}

export async function fetchMerchantStats() {
  return fetchApi('/stats/merchant');
}

// Merchant categories
export async function fetchMerchantCategories() {
  return fetchApi('/merchant-categories');
}
