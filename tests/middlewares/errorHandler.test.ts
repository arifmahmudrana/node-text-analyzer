import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/middlewares/errorHandler';
import { ApiResponse } from '../../src/types';

// Mock Express objects
const mockRequest = (): Partial<Request> => ({});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('errorHandler middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MongoDB ValidationError', () => {
    it('should handle MongoDB validation errors with multiple fields', () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          name: {
            path: 'name',
            message: 'Name is required'
          },
          email: {
            path: 'email',
            message: 'Email is required'
          }
        }
      };

      const req = mockRequest();
      const res = mockResponse();

      errorHandler(validationError, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'name', message: 'Name is required' },
          { field: 'email', message: 'Email is required' }
        ]
      });
    });

    it('should handle MongoDB validation error with single field', () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          title: {
            path: 'title',
            message: 'Title must be at least 3 characters long'
          }
        }
      };

      const req = mockRequest();
      const res = mockResponse();

      errorHandler(validationError, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'title', message: 'Title must be at least 3 characters long' }
        ]
      });
    });
  });

  describe('MongoDB duplicate key error', () => {
    it('should handle duplicate key error for single field', () => {
      const duplicateError = {
        code: 11000,
        keyPattern: { email: 1 }
      };

      const req = mockRequest();
      const res = mockResponse();

      errorHandler(duplicateError, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Duplicate entry',
        errors: [
          { field: 'email', message: 'email already exists' }
        ]
      });
    });

    it('should handle duplicate key error for compound index', () => {
      const duplicateError = {
        code: 11000,
        keyPattern: { username: 1, tenant: 1 }
      };

      const req = mockRequest();
      const res = mockResponse();

      errorHandler(duplicateError, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Duplicate entry',
        errors: [
          { field: 'username', message: 'username already exists' }
        ]
      });
    });
  });

  describe('MongoDB CastError', () => {
    it('should handle invalid ObjectId cast error', () => {
      const castError = {
        name: 'CastError',
        path: '_id',
        value: 'invalid-id',
        kind: 'ObjectId'
      };

      const req = mockRequest();
      const res = mockResponse();

      errorHandler(castError, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid ID format'
      });
    });

    it('should handle cast error for other types', () => {
      const castError = {
        name: 'CastError',
        path: 'age',
        value: 'not-a-number',
        kind: 'Number'
      };

      const req = mockRequest();
      const res = mockResponse();

      errorHandler(castError, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid ID format'
      });
    });
  });

  describe('generic errors', () => {
    it('should handle generic Error objects', () => {
      const genericError = new Error('Something went wrong');

      const req = mockRequest();
      const res = mockResponse();

      errorHandler(genericError, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });

    it('should handle unknown error types', () => {
      const unknownError = {
        someProperty: 'unknown error type'
      };

      const req = mockRequest();
      const res = mockResponse();

      errorHandler(unknownError, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });

    it('should handle null/undefined errors', () => {
      const req = mockRequest();
      const res = mockResponse();

      errorHandler(null, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });

    it('should handle string errors', () => {
      const stringError = 'Something went wrong';

      const req = mockRequest();
      const res = mockResponse();

      errorHandler(stringError, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('logging', () => {
    it('should log all errors to console', () => {
      const testError = new Error('Test error');
      const req = mockRequest();
      const res = mockResponse();

      errorHandler(testError, req as Request, res as Response, mockNext);

      expect(console.error).toHaveBeenCalledWith('Error:', testError);
    });

    it('should log MongoDB validation errors', () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          name: { path: 'name', message: 'Name is required' }
        }
      };

      const req = mockRequest();
      const res = mockResponse();

      errorHandler(validationError, req as Request, res as Response, mockNext);

      expect(console.error).toHaveBeenCalledWith('Error:', validationError);
    });
  });

  describe('response structure', () => {
    it('should not include errors field when there are no specific errors', () => {
      const genericError = new Error('Generic error');
      const req = mockRequest();
      const res = mockResponse();

      errorHandler(genericError, req as Request, res as Response, mockNext);

      const response = (res.json as jest.Mock).mock.calls[0][0] as ApiResponse;
      
      expect(response).toEqual({
        success: false,
        message: 'Internal server error'
      });
      expect(response.errors).toBeUndefined();
    });

    it('should include errors field when there are specific validation errors', () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          name: { path: 'name', message: 'Name is required' }
        }
      };

      const req = mockRequest();
      const res = mockResponse();

      errorHandler(validationError, req as Request, res as Response, mockNext);

      const response = (res.json as jest.Mock).mock.calls[0][0] as ApiResponse;
      
      expect(response.errors).toBeDefined();
      expect(Array.isArray(response.errors)).toBe(true);
    });

    it('should always set success to false', () => {
      const errors = [
        new Error('Generic error'),
        { name: 'ValidationError', errors: { name: { path: 'name', message: 'Required' }}},
        { code: 11000, keyPattern: { email: 1 }},
        { name: 'CastError' }
      ];

      errors.forEach(error => {
        const req = mockRequest();
        const res = mockResponse();

        errorHandler(error, req as Request, res as Response, mockNext);

        const response = (res.json as jest.Mock).mock.calls[0][0] as ApiResponse;
        expect(response.success).toBe(false);

        jest.clearAllMocks();
      });
    });
  });

  describe('middleware behavior', () => {
    it('should not call next() after handling error', () => {
      const testError = new Error('Test error');
      const req = mockRequest();
      const res = mockResponse();

      errorHandler(testError, req as Request, res as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should always send a response', () => {
      const testError = new Error('Test error');
      const req = mockRequest();
      const res = mockResponse();

      errorHandler(testError, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });
});
