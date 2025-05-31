import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { ApiResponse } from '../types';

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors
      };

      res.status(400).json(response);

      return
    }

    req.body = value;
    next();
  };
};
