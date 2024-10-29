export enum StatusText {
  SUCCESS = 'success',
  FAILED = 'failed',
  ERROR = 'error',
  BAD_REQUEST = 'bad request',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  CONFLICT = 'conflict',
}

export type statusValue = (typeof StatusText)[keyof typeof StatusText];

export enum HttpExceptionMessage {
  UNKNOWN = 'Unknown error has occured',
}
