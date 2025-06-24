import { Request, Response, NextFunction } from 'express';
import { PaginationQuery, PaginationOptions } from '../types/pagination';

export const createPaginationMiddleware = (options: PaginationOptions) => {
  const {
    allowedOrderByFields,
    defaultLimit = 10,
    maxLimit = 100,
    defaultOrder = 'asc',
    defaultOrderBy = ['id']
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const query = req.query as PaginationQuery;
      
      // Parse page
      let page = parseInt(query.page || '1', 10);
      if (isNaN(page) || page < 1) {
        page = 1; // Default to page 1 if invalid
      }
      
      // Parse limit
      let limit = parseInt(query.limit || defaultLimit.toString(), 10);
      if (isNaN(limit) || limit < 1 || limit > maxLimit) {
        limit = defaultLimit; // Default to defaultLimit if invalid
      }
      
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Parse order direction
      const order = query.order === 'desc' ? 'desc' : defaultOrder;
      
      // Parse orderBy fields
      let orderByFields: string[] = [];
      
      if (query.orderBy) {
        if (Array.isArray(query.orderBy)) {
          orderByFields = query.orderBy;
        } else if (typeof query.orderBy === 'string') {
          // Handle comma-separated string
          orderByFields = query.orderBy.split(',').map(field => field.trim());
        }
      }
      
      // Filter valid orderBy fields
      const validOrderByFields = orderByFields.filter(field => 
        allowedOrderByFields.includes(field)
      );
      
      // Use default if no valid fields
      const orderBy = validOrderByFields.length > 0 ? validOrderByFields : defaultOrderBy;
      
      // Attach pagination params to request
      req.pagination = {
        page,
        limit,
        offset,
        orderBy,
        order
      };
      
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Invalid pagination parameters',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
};

// Helper function to create pagination response metadata
export const createPaginationMeta = (
  page: number,
  limit: number,
  totalCount: number
) => {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalCount,
    limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};
