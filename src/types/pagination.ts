export interface PaginationQuery {
  page?: string;
  limit?: string;
  orderBy?: string | string[];
  order?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  orderBy: string[];
  order: 'asc' | 'desc';
}

export interface PaginationOptions {
  allowedOrderByFields: string[];
  defaultLimit?: number;
  maxLimit?: number;
  defaultOrder?: 'asc' | 'desc';
  defaultOrderBy?: string[];
}

// Extend Express Request interface using declaration merging
declare global {
  namespace Express {
    interface Request {
      pagination?: PaginationParams;
    }
  }
}
