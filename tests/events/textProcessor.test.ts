import mongoose from 'mongoose';
import { textProcessor } from '../../src/events/textProcessor';
import Text from '../../src/models/Text';
import * as textHelpers from '../../src/helpers/text';

// Mock the entire Text model to prevent any database operations
jest.mock('../../src/models/Text', () => ({
  findByIdAndUpdate: jest.fn().mockResolvedValue({})
}));

describe('TextProcessor', () => {
  const mockTextId = new mongoose.Types.ObjectId();
  const mockText = 'Hello world.\nThis is a test paragraph.';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset the shutdown state
    (textProcessor as any).isShuttingDown = false;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    // Ensure the processor is shut down and all listeners are removed
    (textProcessor as any).isShuttingDown = true;
    textProcessor.removeAllListeners();
    
    // Wait for any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    
    jest.restoreAllMocks();
  });

  it('should process text analysis when event is emitted and update the document', async () => {
    jest.spyOn(textHelpers, 'countWords').mockReturnValue(6);
    jest.spyOn(textHelpers, 'countCharacters').mockReturnValue(36);
    jest.spyOn(textHelpers, 'countSentences').mockReturnValue(2);
    jest.spyOn(textHelpers, 'countParagraphs').mockReturnValue(2);
    jest.spyOn(textHelpers, 'getLongestWordsInParagraphs').mockReturnValue([
      'Hello',
      'paragraph'
    ]);
    const mockFindByIdAndUpdate = Text.findByIdAndUpdate as jest.Mock;
    
    // Create a promise to track when the async processing is done
    let resolveProcessing: () => void;
    const processingDone = new Promise<void>((resolve) => {
      resolveProcessing = resolve;
    });

    // Override the mock to resolve our promise when called
    mockFindByIdAndUpdate.mockImplementation(async (...args) => {
      // Simulate async database operation
      await new Promise(resolve => setTimeout(resolve, 10));
      resolveProcessing();
      return { _id: mockTextId, done: true };
    });

    // Emit the event
    textProcessor.emitTextCreated(mockTextId, mockText);

    // Wait for the async processing to complete
    await processingDone;

    expect(textHelpers.countWords).toHaveBeenCalledWith(mockText);
    expect(textHelpers.countCharacters).toHaveBeenCalledWith(mockText);
    expect(textHelpers.countSentences).toHaveBeenCalledWith(mockText);
    expect(textHelpers.countParagraphs).toHaveBeenCalledWith(mockText);
    expect(textHelpers.getLongestWordsInParagraphs).toHaveBeenCalledWith(mockText);
    // Verify the database update was called
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      mockTextId,
      expect.objectContaining({
        numberOfWords: 6,
        numberOfCharacters: 36,
        numberOfSentences: 2,
        numberOfParagraphs: 2,
        longestWordsInParagraphs: ['Hello', 'paragraph'],
        done: true,
      }),
      { new: true }
    );
  });

  it('should not process text if shutting down', async () => {
    // Set shutdown state
    (textProcessor as any).isShuttingDown = true;
    const updateMock = jest.spyOn(Text, 'findByIdAndUpdate');
    
    const spy = jest.spyOn(textProcessor, 'emit');
    textProcessor.emitTextCreated(mockTextId, mockText);
    
    // Should not emit when shutting down
    expect(spy).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('should emit text:created event and call processTextAnalysis', () => {
    const spy = jest.spyOn(textProcessor, 'emit');
    textProcessor.emitTextCreated(mockTextId, mockText);
    expect(spy).toHaveBeenCalledWith('text:created', { textId: mockTextId, text: mockText });
  });
});
