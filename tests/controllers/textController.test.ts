import { Request, Response, NextFunction } from 'express';
import { createText, getTextById, listTexts, ITextDocument } from '../../src/controllers/textController';
import Text from '../../src/models/Text';
import { textProcessor } from '../../src/events/textProcessor';
import { createPaginationMeta } from '../../src/middlewares/pagination';
import mongoose from 'mongoose';
import { ApiResponse } from '../../src/types';

// Mock dependencies
jest.mock('../../src/models/Text');
jest.mock('../../src/events/textProcessor');
jest.mock('../../src/middlewares/pagination');

describe('Text Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {};
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('createText', () => {
    const mockTextData = {
      text: 'This is a sample text for testing purposes.',
    };

    const mockSavedText = {
      _id: new mongoose.Types.ObjectId(),
      text: mockTextData.text,
      done: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue({
        _id: new mongoose.Types.ObjectId(),
        text: mockTextData.text,
        done: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    beforeEach(() => {
      mockRequest.body = mockTextData;
      (Text as jest.MockedClass<typeof Text>).mockImplementation(() => mockSavedText as any);
    });

    it('should create text successfully', async () => {
      const mockEmitTextCreated = jest.fn();
      (textProcessor.emitTextCreated as jest.Mock) = mockEmitTextCreated;

      await createText(mockRequest as Request, mockResponse as Response, mockNext);

      expect(Text).toHaveBeenCalledWith(mockTextData);
      expect(mockSavedText.save).toHaveBeenCalled();
      expect(mockEmitTextCreated).toHaveBeenCalledWith(mockSavedText._id, mockSavedText.text);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockSavedText.toObject(),
        message: 'Text created successfully',
      });
    });

    it('should handle database save errors', async () => {
      const error = new Error('Database save failed');
      mockSavedText.save.mockRejectedValue(error);

      await createText(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });

    it('should handle Text model instantiation errors', async () => {
      const error = new Error('Model instantiation failed');
      (Text as jest.MockedClass<typeof Text>).mockImplementation(() => {
        throw error;
      });

      await createText(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });

    it('should not emit text processing event if save fails', async () => {
      const error = new Error('Database save failed');
      mockSavedText.save.mockRejectedValue(error);
      const mockEmitTextCreated = jest.fn();
      (textProcessor.emitTextCreated as jest.Mock) = mockEmitTextCreated;

      await createText(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockEmitTextCreated).not.toHaveBeenCalled();
    });
  });

  describe('getTextById', () => {
    const validObjectId = new mongoose.Types.ObjectId().toString();
    const mockTextDocument = {
      _id: new mongoose.Types.ObjectId(validObjectId),
      text: 'Sample processed text',
      done: true,
      numberOfWords: 3,
      numberOfCharacters: 21,
      numberOfSentences: 1,
      numberOfParagraphs: 1,
      longestWordsInParagraphs: ['processed'],
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject: jest.fn().mockReturnValue({
        _id: new mongoose.Types.ObjectId(validObjectId),
        text: 'Sample processed text',
        done: true,
        numberOfWords: 3,
        numberOfCharacters: 21,
        numberOfSentences: 1,
        numberOfParagraphs: 1,
        longestWordsInParagraphs: ['processed'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    beforeEach(() => {
      mockRequest.params = { id: validObjectId };
    });

    it('should return text document when found and done is true', async () => {
      (Text.findOne as jest.Mock).mockResolvedValue(mockTextDocument);

      await getTextById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(Text.findOne).toHaveBeenCalledWith({
        _id: validObjectId,
        done: true,
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockTextDocument.toObject(),
        message: 'Text retrieved successfully',
      });
    });

    it('should return 404 when text document is not found', async () => {
      (Text.findOne as jest.Mock).mockResolvedValue(null);

      await getTextById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(Text.findOne).toHaveBeenCalledWith({
        _id: validObjectId,
        done: true,
      });
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Text not found',
      });
    });

    it('should return 404 when text document exists but done is false', async () => {
      // Mock finding a document that exists but done is false
      (Text.findOne as jest.Mock).mockResolvedValue(null);

      await getTextById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(Text.findOne).toHaveBeenCalledWith({
        _id: validObjectId,
        done: true,
      });
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Text not found',
      });
    });

    it('should return 404 for invalid ObjectId format', async () => {
      mockRequest.params = { id: 'invalid-object-id' };

      await getTextById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(Text.findOne).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Text not found',
      });
    });

    it('should return 404 for empty id', async () => {
      mockRequest.params = { id: '' };

      await getTextById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(Text.findOne).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Text not found',
      });
    });

    it('should return 404 for undefined id', async () => {
      mockRequest.params = {};

      await getTextById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(Text.findOne).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Text not found',
      });
    });

    it('should handle database query errors', async () => {
      const error = new Error('Database query failed');
      (Text.findOne as jest.Mock).mockRejectedValue(error);

      await getTextById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });

    it('should call toObject() on the found document', async () => {
      (Text.findOne as jest.Mock).mockResolvedValue(mockTextDocument);

      await getTextById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockTextDocument.toObject).toHaveBeenCalled();
    });
  });

  describe('listTexts', () => {
    const mockTexts = [
      {
        _id: new mongoose.Types.ObjectId(),
        text: 'First text',
        done: true,
        numberOfWords: 2,
        numberOfCharacters: 10,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        text: 'Second text',
        done: false,
        numberOfWords: 2,
        numberOfCharacters: 11,
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02'),
      },
    ];

    const mockPagination = {
      page: 1,
      limit: 10,
      offset: 0,
      orderBy: ['createdAt'],
      order: 'desc' as const,
    };

    const mockPaginationMeta = {
      currentPage: 1,
      totalPages: 1,
      totalCount: 2,
      limit: 10,
      hasNextPage: false,
      hasPrevPage: false,
      nextPage: null,
      prevPage: null,
    };

    beforeEach(() => {
      mockRequest.query = {};
      mockRequest.pagination = mockPagination;
      
      // Mock Text methods
      (Text.countDocuments as jest.Mock).mockResolvedValue(2);
      (Text.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockTexts),
      });
      
      (createPaginationMeta as jest.Mock).mockReturnValue(mockPaginationMeta);
    });

    it('should list all texts successfully with default parameters', async () => {
      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(Text.countDocuments).toHaveBeenCalledWith({});
      expect(Text.find).toHaveBeenCalledWith({});
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockTexts,
        message: 'Texts retrieved successfully',
        meta: mockPaginationMeta,
      });
    });

    it('should filter texts by done=true', async () => {
      mockRequest.query = { done: 'true' };

      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(Text.countDocuments).toHaveBeenCalledWith({ done: true });
      expect(Text.find).toHaveBeenCalledWith({ done: true });
    });

    it('should filter texts by done=false', async () => {
      mockRequest.query = { done: 'false' };

      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(Text.countDocuments).toHaveBeenCalledWith({ done: false });
      expect(Text.find).toHaveBeenCalledWith({ done: false });
    });

    it('should not filter when done=all', async () => {
      mockRequest.query = { done: 'all' };

      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(Text.countDocuments).toHaveBeenCalledWith({});
      expect(Text.find).toHaveBeenCalledWith({});
    });

    it('should apply correct sorting for desc order', async () => {
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockTexts),
      };
      (Text.find as jest.Mock).mockReturnValue(mockFind);

      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFind.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockFind.skip).toHaveBeenCalledWith(0);
      expect(mockFind.limit).toHaveBeenCalledWith(10);
      expect(mockFind.lean).toHaveBeenCalled();
    });

    it('should apply correct sorting for asc order', async () => {
      mockRequest.pagination = {
        ...mockPagination,
        order: 'asc' as const,
      };

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockTexts),
      };
      (Text.find as jest.Mock).mockReturnValue(mockFind);

      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFind.sort).toHaveBeenCalledWith({ createdAt: 1 });
    });

    it('should apply pagination parameters correctly', async () => {
      mockRequest.pagination = {
        ...mockPagination,
        page: 2,
        limit: 5,
        offset: 5,
      };

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockTexts),
      };
      (Text.find as jest.Mock).mockReturnValue(mockFind);

      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFind.skip).toHaveBeenCalledWith(5);
      expect(mockFind.limit).toHaveBeenCalledWith(5);
      expect(createPaginationMeta).toHaveBeenCalledWith(2, 5, 2);
    });

    it('should handle different sort fields', async () => {
      mockRequest.pagination = {
        ...mockPagination,
        orderBy: ['updatedAt'],
      };

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockTexts),
      };
      (Text.find as jest.Mock).mockReturnValue(mockFind);

      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFind.sort).toHaveBeenCalledWith({ updatedAt: -1 });
    });

    it('should return 500 when pagination middleware is not configured', async () => {
      mockRequest.pagination = undefined;

      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Pagination middleware not configured',
      });
      expect(Text.countDocuments).not.toHaveBeenCalled();
      expect(Text.find).not.toHaveBeenCalled();
    });

    it('should handle countDocuments database errors', async () => {
      const error = new Error('Database count failed');
      (Text.countDocuments as jest.Mock).mockRejectedValue(error);

      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });

    it('should handle find database errors', async () => {
      const error = new Error('Database find failed');
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(error),
      };
      (Text.find as jest.Mock).mockReturnValue(mockFind);

      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });

    it('should return empty array when no texts found', async () => {
      (Text.countDocuments as jest.Mock).mockResolvedValue(0);
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      (Text.find as jest.Mock).mockReturnValue(mockFind);

      const emptyPaginationMeta = {
        ...mockPaginationMeta,
        totalCount: 0,
        totalPages: 0,
      };
      (createPaginationMeta as jest.Mock).mockReturnValue(emptyPaginationMeta);

      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: [],
        message: 'Texts retrieved successfully',
        meta: emptyPaginationMeta,
      });
    });

    it('should create pagination metadata with correct parameters', async () => {
      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(createPaginationMeta).toHaveBeenCalledWith(
        mockPagination.page,
        mockPagination.limit,
        2 // totalCount
      );
    });

    it('should combine filtering and pagination correctly', async () => {
      mockRequest.query = { done: 'true' };
      mockRequest.pagination = {
        ...mockPagination,
        page: 2,
        limit: 3,
        offset: 3,
      };

      const filteredTexts = [mockTexts[0]]; // Only the done: true text
      (Text.countDocuments as jest.Mock).mockResolvedValue(1);
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(filteredTexts),
      };
      (Text.find as jest.Mock).mockReturnValue(mockFind);

      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(Text.countDocuments).toHaveBeenCalledWith({ done: true });
      expect(Text.find).toHaveBeenCalledWith({ done: true });
      expect(mockFind.skip).toHaveBeenCalledWith(3);
      expect(mockFind.limit).toHaveBeenCalledWith(3);
      expect(createPaginationMeta).toHaveBeenCalledWith(2, 3, 1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing request body in createText', async () => {
      mockRequest.body = undefined;
      const error = new Error('Request body is required');
      (Text as jest.MockedClass<typeof Text>).mockImplementation(() => {
        throw error;
      });

      await createText(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle database errors during ObjectId query', async () => {
      // Use a valid ObjectId format that could still cause database errors
      const validObjectId = new mongoose.Types.ObjectId().toString();
      mockRequest.params = { id: validObjectId };
      
      const error = new Error('Database connection failed');
      (Text.findOne as jest.Mock).mockRejectedValue(error);

      await getTextById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('Response Structure Validation', () => {
    it('should return properly structured ApiResponse for successful createText', async () => {
      const mockTextData = { text: 'Test text' };
      mockRequest.body = mockTextData;

      const mockSavedText = {
        _id: new mongoose.Types.ObjectId(),
        text: mockTextData.text,
        done: false,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: new mongoose.Types.ObjectId(),
          text: mockTextData.text,
          done: false,
        }),
      };

      (Text as jest.MockedClass<typeof Text>).mockImplementation(() => mockSavedText as any);
      (textProcessor.emitTextCreated as jest.Mock) = jest.fn();

      await createText(mockRequest as Request, mockResponse as Response, mockNext);

      const expectedResponse: ApiResponse<ITextDocument> = {
        success: true,
        data: mockSavedText.toObject(),
        message: 'Text created successfully',
      };

      expect(mockJson).toHaveBeenCalledWith(expectedResponse);
    });

    it('should return properly structured ApiResponse for successful getTextById', async () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      mockRequest.params = { id: validObjectId };

      const mockTextDocument = {
        _id: new mongoose.Types.ObjectId(validObjectId),
        text: 'Test text',
        done: true,
        toObject: jest.fn().mockReturnValue({
          _id: new mongoose.Types.ObjectId(validObjectId),
          text: 'Test text',
          done: true,
        }),
      };

      (Text.findOne as jest.Mock).mockResolvedValue(mockTextDocument);

      await getTextById(mockRequest as Request, mockResponse as Response, mockNext);

      const expectedResponse: ApiResponse<ITextDocument> = {
        success: true,
        data: mockTextDocument.toObject(),
        message: 'Text retrieved successfully',
      };

      expect(mockJson).toHaveBeenCalledWith(expectedResponse);
    });

    it('should return properly structured ApiResponse for successful listTexts', async () => {
      mockRequest.query = {};
      const mockTexts = [
        {
          _id: new mongoose.Types.ObjectId(),
          text: 'Test text',
          done: true,
        },
      ];

      const mockPaginationMeta = {
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null,
      };

      mockRequest.pagination = {
        page: 1,
        limit: 10,
        offset: 0,
        orderBy: ['createdAt'],
        order: 'desc' as const,
      };

      (Text.countDocuments as jest.Mock).mockResolvedValue(1);
      (Text.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockTexts),
      });
      (createPaginationMeta as jest.Mock).mockReturnValue(mockPaginationMeta);

      await listTexts(mockRequest as Request, mockResponse as Response, mockNext);

      const expectedResponse: ApiResponse<ITextDocument[]> = {
        success: true,
        data: mockTexts,
        message: 'Texts retrieved successfully',
        meta: mockPaginationMeta,
      };

      expect(mockJson).toHaveBeenCalledWith(expectedResponse);
    });
  });
});
