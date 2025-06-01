import { Request, Response, NextFunction } from 'express';
import { createPaginationMiddleware, createPaginationMeta } from '../../src/middlewares/pagination';

// Extend Request interface for testing
interface TestRequest extends Request {
  pagination?: {
    page: number;
    limit: number;
    offset: number;
    orderBy: string[];
    order: 'asc' | 'desc';
  };
}

// Mock Express objects
const mockRequest = (query: any = {}): Partial<Request> => ({
  query
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

describe('Pagination Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultOptions = {
    allowedOrderByFields: ['id', 'name', 'email', 'createdAt'],
    defaultLimit: 10,
    maxLimit: 100,
    defaultOrder: 'asc' as const,
    defaultOrderBy: ['id']
  };

  describe('Basic pagination parameters', () => {
    test('should set default values when no query parameters provided', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      const req = mockRequest() as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination).toEqual({
        page: 1,
        limit: 10,
        offset: 0,
        orderBy: ['id'],
        order: 'asc'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should parse valid page and limit parameters', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      const req = mockRequest({ page: '3', limit: '25' }) as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination).toEqual({
        page: 3,
        limit: 25,
        offset: 50,
        orderBy: ['id'],
        order: 'asc'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should enforce minimum page value of 1', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      const req = mockRequest({ page: '0' }) as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination!.page).toBe(1);
      expect(req.pagination!.offset).toBe(0);
    });

    test('should enforce maximum limit to default limit', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      const req = mockRequest({ limit: '200' }) as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination!.limit).toBe(10);
    });

    test('should enforce minimum limit to default limit', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      const req = mockRequest({ limit: '0' }) as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination!.limit).toBe(10);
    });
  });

  describe('Order by functionality', () => {
    test('should handle single orderBy field as string', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      const req = mockRequest({ orderBy: 'name' }) as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination!.orderBy).toEqual(['name']);
    });

    test('should handle multiple orderBy fields as array', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      const req = mockRequest({ orderBy: ['name', 'email'] }) as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination!.orderBy).toEqual(['name', 'email']);
    });

    test('should handle comma-separated orderBy fields', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      const req = mockRequest({ orderBy: 'name,email,createdAt' }) as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination!.orderBy).toEqual(['name', 'email', 'createdAt']);
    });

    test('should filter out invalid orderBy fields', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      const req = mockRequest({ 
        orderBy: ['name', 'invalidField', 'email', 'anotherInvalid'] 
      }) as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination!.orderBy).toEqual(['name', 'email']);
    });

    test('should use default orderBy when all fields are invalid', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      const req = mockRequest({ orderBy: ['invalid1', 'invalid2'] }) as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination!.orderBy).toEqual(['id']);
    });

    test('should handle ascending order', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      const req = mockRequest({ order: 'asc' }) as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination!.order).toBe('asc');
    });

    test('should handle descending order', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      const req = mockRequest({ order: 'desc' }) as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination!.order).toBe('desc');
    });

    test('should default to asc for invalid order values', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      const req = mockRequest({ order: 'invalid' }) as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination!.order).toBe('asc');
    });
  });

  describe('Custom options', () => {
    test('should use custom default values', () => {
      const customOptions = {
        allowedOrderByFields: ['name', 'date'],
        defaultLimit: 5,
        maxLimit: 50,
        defaultOrder: 'desc' as const,
        defaultOrderBy: ['name']
      };

      const middleware = createPaginationMiddleware(customOptions);
      const req = mockRequest() as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination).toEqual({
        page: 1,
        limit: 5,
        offset: 0,
        orderBy: ['name'],
        order: 'desc'
      });
    });
  });

  describe('Error handling', () => {
    test('should handle invalid numeric values gracefully', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      const req = mockRequest({ page: 'invalid', limit: 'notanumber' }) as TestRequest;
      const res = mockResponse();

      middleware(req as Request, res as Response, mockNext);

      expect(req.pagination!.page).toBe(1); // NaN becomes 1 due to Math.max
      expect(req.pagination!.limit).toBe(10); // NaN becomes default limit
    });
  });

  describe('Offset calculation', () => {
    test('should calculate correct offset for different pages', () => {
      const middleware = createPaginationMiddleware(defaultOptions);
      
      const testCases = [
        { page: 1, limit: 10, expectedOffset: 0 },
        { page: 2, limit: 10, expectedOffset: 10 },
        { page: 3, limit: 20, expectedOffset: 40 },
        { page: 5, limit: 5, expectedOffset: 20 }
      ];

      testCases.forEach(({ page, limit, expectedOffset }) => {
        const req = mockRequest({ 
          page: page.toString(), 
          limit: limit.toString() 
        }) as TestRequest;
        const res = mockResponse();

        middleware(req as Request, res as Response, mockNext);

        expect(req.pagination!.offset).toBe(expectedOffset);
      });
    });
  });
});

describe('Helper Functions', () => {
  describe('createPaginationMeta', () => {
    test('should create correct pagination metadata', () => {
      const result = createPaginationMeta(2, 10, 45);
      
      expect(result).toEqual({
        currentPage: 2,
        totalPages: 5,
        totalCount: 45,
        limit: 10,
        hasNextPage: true,
        hasPrevPage: true,
        nextPage: 3,
        prevPage: 1
      });
    });

    test('should handle first page correctly', () => {
      const result = createPaginationMeta(1, 10, 45);
      
      expect(result).toEqual({
        currentPage: 1,
        totalPages: 5,
        totalCount: 45,
        limit: 10,
        hasNextPage: true,
        hasPrevPage: false,
        nextPage: 2,
        prevPage: null
      });
    });

    test('should handle last page correctly', () => {
      const result = createPaginationMeta(5, 10, 45);
      
      expect(result).toEqual({
        currentPage: 5,
        totalPages: 5,
        totalCount: 45,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: true,
        nextPage: null,
        prevPage: 4
      });
    });

    test('should handle single page scenario', () => {
      const result = createPaginationMeta(1, 10, 5);
      
      expect(result).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalCount: 5,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null
      });
    });

    test('should handle zero results', () => {
      const result = createPaginationMeta(1, 10, 0);
      
      expect(result).toEqual({
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null
      });
    });
  });
});

// Integration test example
describe('Integration Test', () => {
  test('should work with Express route handler', () => {
    const middleware = createPaginationMiddleware({
      allowedOrderByFields: ['id', 'name', 'email'],
      defaultLimit: 20,
      maxLimit: 100
    });

    const req = mockRequest({
      page: '2',
      limit: '15',
      orderBy: 'name,email',
      order: 'desc'
    }) as TestRequest;
    
    const res = mockResponse();

    middleware(req as Request, res as Response, mockNext);

    // Verify middleware processed the request correctly
    expect(req.pagination).toEqual({
      page: 2,
      limit: 15,
      offset: 15,
      orderBy: ['name', 'email'],
      order: 'desc'
    });

    // Verify pagination metadata creation
    const meta = createPaginationMeta(
      req.pagination!.page,
      req.pagination!.limit,
      100 // assume total count of 100
    );
    
    expect(meta.currentPage).toBe(2);
    expect(meta.totalPages).toBe(7);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(true);
  });
});
