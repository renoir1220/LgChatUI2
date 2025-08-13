// Shared types for user information

export interface User {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  roles?: string[];
  createdAt?: string; // ISO timestamp
}

export interface AuthToken {
  accessToken: string;
  expiresAt?: number; // epoch millis
}

