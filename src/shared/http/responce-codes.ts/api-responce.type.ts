export type ApiResponseEnvelope<T> =
  | {
      data: T;
      error: null;
      server_timestamp: string;
    }
  | {
      data: null;
      error: ApiError;
      server_timestamp: string;
    };

export interface ApiError {
  code: string;
  message: string;
  details?: ApiErrorDetails;
}

export interface ApiErrorDetails {
  field_errors?: FieldError[];
  [key: string]: unknown;
}

export interface FieldError {
  field: string;
  detail: string;
}
