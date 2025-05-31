import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  let statusCode = 500;
  let message = 'Internal server error';
  let errors = null;

  // Handle null/undefined errors
  if (!err) {
    const response: ApiResponse = {
      success: false,
      message
    };

    res.status(statusCode).json(response);
    return;
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message
    }));
  }
  
  // MongoDB duplicate key error
  else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
    const field = Object.keys(err.keyPattern)[0];
    errors = [{ field, message: `${field} already exists` }];
  }
  
  // MongoDB cast error
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  const response: ApiResponse = {
    success: false,
    message,
    ...(errors && { errors })
  };

  res.status(statusCode).json(response);
};
