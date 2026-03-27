const MESSAGES = {
  SUCCESS_MSG: {
    REGISTERED: 'Registered successfully',
    LOG_IN: 'Log in successfully',
    LOGGED_OUT: 'Logged out successfully',

    CREATED: 'Created successfully',
    UPDATED: 'Updated successfully',
    DELETED: 'Deleted successfully',
    FETCHED: 'Fetched successfully',
  },
  ERROR_MSG: {
    JSON_WEB_TOKEN_ERROR: 'JsonWebTokenError',
    TOKEN_EXPIRED_ERROR: 'TokenExpiredError',
    TOKEN_EXPIRED: 'Token has expired!',

    EMAIL_EXISTS: 'Email already exists with another user',
    INVALID_CREDENTIALS: 'Invalid email or password',
    INVALID_PASSWORD: 'Invalid password',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    INVALID_TOKEN: 'Token Expired',
    
  },
} as const;

export const { SUCCESS_MSG, ERROR_MSG } = MESSAGES;
