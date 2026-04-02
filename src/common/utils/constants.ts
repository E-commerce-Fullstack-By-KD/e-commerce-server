const MESSAGES = {
  SUCCESS_MSG: {
    REGISTERED: 'Registered successfully',
    LOG_IN: 'Log in successfully',
    LOGGED_OUT: 'Logged out successfully',

    CREATED: 'Created successfully',
    UPDATED: 'Updated successfully',
    DELETED: 'Deleted successfully',
    FETCHED: 'Fetched successfully',
    ACCOUNT_ALREADY_VERIFIED: 'Account is already verified',
    ACCOUNT_VERIFIED: 'Account verified successfully',
    ORDER_CREATED: 'Order created successfully',
  
  },
  ERROR_MSG: {
    JSON_WEB_TOKEN_ERROR: 'JsonWebTokenError',
    TOKEN_EXPIRED_ERROR: 'TokenExpiredError',
    TOKEN_EXPIRED: 'Token has expired!',

    EMAIL_EXISTS: 'Email already exists with another user',
    VERIFY_EMAIL: 'Verify your email to log in',
    USER_NOT_FOUND: 'User not found',
    INVALID_CREDENTIALS: 'Invalid email or password',
    INVALID_PASSWORD: 'Invalid password',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    INVALID_TOKEN: 'Token Expired',

    RECORD_NOT_FOUND: 'Record not found',
    PAYMENT_VERIFICATION_FAILED: 'Payment verification failed',
  },
} as const;

export const RESOURCE_NAMES = {
  COLLECTION: 'Collections',
  PRODUCT: 'Product',
  USER: 'User',
};

export const { SUCCESS_MSG, ERROR_MSG } = MESSAGES;
