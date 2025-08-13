export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

export enum ErrorCode {
  Unknown = 'UNKNOWN',
  Validation = 'VALIDATION_ERROR',
}

export class ApiError extends Error {
  code: ErrorCode
  details?: unknown
  constructor(message: string, code: ErrorCode = ErrorCode.Unknown, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

export type ApiResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: { code: ErrorCode; message: string; details?: unknown }
}
