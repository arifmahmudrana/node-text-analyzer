import { Request, Response, NextFunction } from 'express';
import { createText, getTextById, ITextDocument } from '../../src/controllers/textController';
import Text from '../../src/models/Text';
import { textProcessor } from '../../src/events/textProcessor';
import mongoose from 'mongoose';
import { ApiResponse } from '../../src/types';

// Mock dependencies
jest.mock('../../src/models/Text');
jest.mock('../../src/events/textProcessor');

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
  });
});
