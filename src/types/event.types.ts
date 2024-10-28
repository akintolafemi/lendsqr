export enum EventType {
  USER_AUTHENTICATED = 'user.authenticated',
  USER_CREATED = 'user.created',
  AUDIT_LOG = 'audit.log',

  TRANSFER_WITH_PAYSTACK = 'transfer.paystack',
}

export type event = (typeof EventType)[keyof typeof EventType];
