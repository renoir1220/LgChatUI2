// Shared API configuration types

export interface ApiConfig {
  baseUrl: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  authToken?: string; // e.g., Bearer token
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: '',
};

