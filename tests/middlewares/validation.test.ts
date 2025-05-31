import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validateRequest } from '../../src/middlewares/validation';
import { ApiResponse } from '../../src/types';

type ValidationError = {
  field: string;
  message: string;
};

// Mock Express objects
const mockRequest = (body: any = {}): Partial<Request> => ({
  body
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

describe('validateRequest middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when validation passes', () => {
    it('should call next() and not send response', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });

      const req = mockRequest({
        name: 'John Doe',
        email: 'john@example.com'
      });
      const res = mockResponse();

      const middleware = validateRequest(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should strip unknown fields when stripUnknown is true', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      const req = mockRequest({
        name: 'John Doe',
        unknownField: 'should be removed'
      });
      const res = mockResponse();

      const middleware = validateRequest(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(req.body).toEqual({ name: 'John Doe' });
      expect(req.body.unknownField).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should transform/coerce values according to schema', () => {
      const schema = Joi.object({
        age: Joi.number().required(),
        isActive: Joi.boolean().required()
      });

      const req = mockRequest({
        age: '25', // string should be converted to number
        isActive: 'true' // string should be converted to boolean
      });
      const res = mockResponse();

      const middleware = validateRequest(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(req.body.age).toBe(25);
      expect(req.body.isActive).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('when validation fails', () => {
    it('should return 400 status with validation errors', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });

      const req = mockRequest({
        name: '', // invalid - empty string
        email: 'invalid-email' // invalid - not proper email format
      });
      const res = mockResponse();

      const middleware = validateRequest(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.stringContaining('not allowed to be empty')
          }),
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('valid email')
          })
        ])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing required fields', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });

      const req = mockRequest({}); // empty body
      const res = mockResponse();

      const middleware = validateRequest(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.stringContaining('required')
          }),
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('required')
          })
        ])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle nested field validation errors', () => {
      const schema = Joi.object({
        user: Joi.object({
          profile: Joi.object({
            name: Joi.string().required()
          }).required()
        }).required()
      });

      const req = mockRequest({
        user: {
          profile: {
            name: '' // invalid - empty string
          }
        }
      });
      const res = mockResponse();

      const middleware = validateRequest(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'user.profile.name',
            message: expect.stringContaining('not allowed to be empty')
          })
        ])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should collect all validation errors when abortEarly is false', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().min(18).required()
      });

      const req = mockRequest({
        name: '',
        email: 'invalid',
        age: 15
      });
      const res = mockResponse();

      const middleware = validateRequest(schema);
      middleware(req as Request, res as Response, mockNext);

      const response = (res.json as jest.Mock).mock.calls[0][0] as ApiResponse;
      
      expect(response.errors).toHaveLength(3);
      expect(response.errors?.map(({ field }: ValidationError) => field)).toEqual(
        expect.arrayContaining(['name', 'email', 'age'])
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined request body', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      const req = mockRequest(); // no body provided
      const res = mockResponse();

      const middleware = validateRequest(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty schema', () => {
      const schema = Joi.object({});

      const req = mockRequest({ anyField: 'any value' });
      const res = mockResponse();

      const middleware = validateRequest(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(req.body).toEqual({}); // stripped unknown fields
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle complex validation rules', () => {
      const schema = Joi.object({
        password: Joi.string()
          .min(8)
          .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
          .required()
          .messages({
            'string.pattern.base': 'Password must contain at least one lowercase, one uppercase, and one digit'
          })
      });

      const req = mockRequest({
        password: 'weak'
      });
      const res = mockResponse();

      const middleware = validateRequest(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      const response = (res.json as jest.Mock).mock.calls[0][0] as ApiResponse;
      
      expect(response.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: expect.stringContaining('at least 8 characters')
          }),
          expect.objectContaining({
            field: 'password',
            message: 'Password must contain at least one lowercase, one uppercase, and one digit'
          })
        ])
      );
    });
  });
});
