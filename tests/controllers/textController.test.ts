import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ITextDocument, createText } from '../../src/controllers/textController';
import { ApiResponse } from '../../src/types';

// Mock the Text model
jest.mock('../../src/models/Text');
import Text from '../../src/models/Text';
const MockedText = Text as jest.MockedClass<typeof Text>;

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

describe('createText controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful text creation', () => {
    it('should create text and return 201 status with success response', async () => {
      const textData = {
        text: 'This is a sample text for testing.',
        done: false
      };

      const mockTextDocument: ITextDocument = {
        _id: new mongoose.Types.ObjectId(),
        text: 'This is a sample text for testing.',
        done: false,
        numberOfWords: 7,
        numberOfCharacters: 34,
        numberOfSentences: 1,
        numberOfParagraphs: 1,
        longestWordsInParagraphs: ['testing'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockTextInstance = {
        save: jest.fn().mockResolvedValue(mockTextDocument),
        toObject: jest.fn().mockReturnValue(mockTextDocument)
      };

      MockedText.mockImplementation(() => mockTextInstance as any);

      const req = mockRequest(textData);
      const res = mockResponse();

      await createText(req as Request, res as Response, mockNext);

      expect(MockedText).toHaveBeenCalledWith(textData);
      expect(mockTextInstance.save).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTextDocument,
        message: 'Text created successfully'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle partial text data', async () => {
      const partialTextData = {
        text: 'Minimal text',
        done: true
      };

      const mockTextDocument: ITextDocument = {
        _id: new mongoose.Types.ObjectId(),
        text: 'Minimal text',
        done: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockTextInstance = {
        save: jest.fn().mockResolvedValue(mockTextDocument),
        toObject: jest.fn().mockReturnValue(mockTextDocument)
      };

      MockedText.mockImplementation(() => mockTextInstance as any);

      const req = mockRequest(partialTextData);
      const res = mockResponse();

      await createText(req as Request, res as Response, mockNext);

      expect(MockedText).toHaveBeenCalledWith(partialTextData);
      expect(mockTextInstance.save).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTextDocument,
        message: 'Text created successfully'
      });
    });

    it('should handle text with all optional fields', async () => {
      const completeTextData = {
        text: 'Complete text with all fields. This has multiple sentences.',
        done: false,
        numberOfWords: 10,
        numberOfCharacters: 58,
        numberOfSentences: 2,
        numberOfParagraphs: 1,
        longestWordsInParagraphs: ['sentences']
      };

      const mockTextDocument: ITextDocument = {
        _id: new mongoose.Types.ObjectId(),
        ...completeTextData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockTextInstance = {
        save: jest.fn().mockResolvedValue(mockTextDocument),
        toObject: jest.fn().mockReturnValue(mockTextDocument)
      };

      MockedText.mockImplementation(() => mockTextInstance as any);

      const req = mockRequest(completeTextData);
      const res = mockResponse();

      await createText(req as Request, res as Response, mockNext);

      expect(MockedText).toHaveBeenCalledWith(completeTextData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTextDocument,
        message: 'Text created successfully'
      });
    });
  });

  describe('error handling', () => {
    it('should call next with error when Text.save() fails', async () => {
      const textData = {
        text: 'This will fail to save',
        done: false
      };

      const saveError = new Error('Database connection failed');
      const mockTextInstance = {
        save: jest.fn().mockRejectedValue(saveError),
        toObject: jest.fn()
      };

      MockedText.mockImplementation(() => mockTextInstance as any);

      const req = mockRequest(textData);
      const res = mockResponse();

      await createText(req as Request, res as Response, mockNext);

      expect(MockedText).toHaveBeenCalledWith(textData);
      expect(mockTextInstance.save).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(saveError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should call next with MongoDB validation error', async () => {
      const textData = {
        text: '', // invalid - empty text
        done: false
      };

      const validationError = {
        name: 'ValidationError',
        errors: {
          text: {
            path: 'text',
            message: 'Text is required'
          }
        }
      };

      const mockTextInstance = {
        save: jest.fn().mockRejectedValue(validationError),
        toObject: jest.fn()
      };

      MockedText.mockImplementation(() => mockTextInstance as any);

      const req = mockRequest(textData);
      const res = mockResponse();

      await createText(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should call next with MongoDB duplicate key error', async () => {
      const textData = {
        text: 'Duplicate text content',
        done: false
      };

      const duplicateError = {
        code: 11000,
        keyPattern: { text: 1 }
      };

      const mockTextInstance = {
        save: jest.fn().mockRejectedValue(duplicateError),
        toObject: jest.fn()
      };

      MockedText.mockImplementation(() => mockTextInstance as any);

      const req = mockRequest(textData);
      const res = mockResponse();

      await createText(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(duplicateError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle Text constructor throwing error', async () => {
      const textData = {
        text: 'This will cause constructor error',
        done: false
      };

      const constructorError = new Error('Invalid data format');
      MockedText.mockImplementation(() => {
        throw constructorError;
      });

      const req = mockRequest(textData);
      const res = mockResponse();

      await createText(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(constructorError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty request body', async () => {
      const mockTextDocument: ITextDocument = {
        _id: new mongoose.Types.ObjectId(),
        text: '',
        done: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockTextInstance = {
        save: jest.fn().mockResolvedValue(mockTextDocument),
        toObject: jest.fn().mockReturnValue(mockTextDocument)
      };

      MockedText.mockImplementation(() => mockTextInstance as any);

      const req = mockRequest({});
      const res = mockResponse();

      await createText(req as Request, res as Response, mockNext);

      expect(MockedText).toHaveBeenCalledWith({});
      expect(mockTextInstance.save).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle null request body', async () => {
      const mockTextDocument: ITextDocument = {
        _id: new mongoose.Types.ObjectId(),
        text: '',
        done: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockTextInstance = {
        save: jest.fn().mockResolvedValue(mockTextDocument),
        toObject: jest.fn().mockReturnValue(mockTextDocument)
      };

      MockedText.mockImplementation(() => mockTextInstance as any);

      const req = mockRequest(null);
      const res = mockResponse();

      await createText(req as Request, res as Response, mockNext);

      expect(MockedText).toHaveBeenCalledWith(null);
      expect(mockTextInstance.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('response structure', () => {
    it('should return response with correct ApiResponse structure', async () => {
      const textData = {
        text: 'Test response structure',
        done: false
      };

      const mockTextDocument: ITextDocument = {
        _id: new mongoose.Types.ObjectId(),
        text: 'Test response structure',
        done: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockTextInstance = {
        save: jest.fn().mockResolvedValue(mockTextDocument),
        toObject: jest.fn().mockReturnValue(mockTextDocument)
      };

      MockedText.mockImplementation(() => mockTextInstance as any);

      const req = mockRequest(textData);
      const res = mockResponse();

      await createText(req as Request, res as Response, mockNext);

      const response = (res.json as jest.Mock).mock.calls[0][0] as ApiResponse<ITextDocument>;
      
      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('message', 'Text created successfully');
      expect(response.data).toEqual(mockTextDocument);
    });

    it('should call toObject() to serialize document', async () => {
      const textData = {
        text: 'Test toObject call',
        done: false
      };

      const mockTextDocument: ITextDocument = {
        _id: new mongoose.Types.ObjectId(),
        text: 'Test toObject call',
        done: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockTextInstance = {
        save: jest.fn().mockResolvedValue(mockTextDocument),
        toObject: jest.fn().mockReturnValue(mockTextDocument)
      };

      MockedText.mockImplementation(() => mockTextInstance as any);

      const req = mockRequest(textData);
      const res = mockResponse();

      await createText(req as Request, res as Response, mockNext);

      expect(mockTextInstance.toObject).toHaveBeenCalledTimes(1);
    });
  });
});
