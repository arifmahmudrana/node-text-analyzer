// TODO: undefined ID calling don't know why it's double calling

import mongoose from 'mongoose';
import { textProcessor } from '../../src/events/textProcessor';
import Text from '../../src/models/Text';
import * as textHelpers from '../../src/helpers/text';

describe('TextProcessor', () => {
  const mockTextId = new mongoose.Types.ObjectId();
  const mockText = 'Hello world.\nThis is a test paragraph.';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should process text analysis and update the document', async () => {
    jest.spyOn(textHelpers, 'countWords').mockReturnValue(6);
    jest.spyOn(textHelpers, 'countCharacters').mockReturnValue(36);
    jest.spyOn(textHelpers, 'countSentences').mockReturnValue(2);
    jest.spyOn(textHelpers, 'countParagraphs').mockReturnValue(2);
    jest.spyOn(textHelpers, 'getLongestWordsInParagraphs').mockReturnValue([
      'Hello',
      'paragraph'
    ]);
    const updateMock = jest.spyOn(Text, 'findByIdAndUpdate').mockResolvedValue({} as any);
    await (textProcessor as any).processTextAnalysis({ textId: mockTextId, text: mockText });
    expect(textHelpers.countWords).toHaveBeenCalledWith(mockText);
    expect(textHelpers.countCharacters).toHaveBeenCalledWith(mockText);
    expect(textHelpers.countSentences).toHaveBeenCalledWith(mockText);
    expect(textHelpers.countParagraphs).toHaveBeenCalledWith(mockText);
    expect(textHelpers.getLongestWordsInParagraphs).toHaveBeenCalledWith(mockText);
    expect(updateMock).toHaveBeenCalledWith(
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
    (textProcessor as any).isShuttingDown = true;
    const updateMock = jest.spyOn(Text, 'findByIdAndUpdate');
    await (textProcessor as any).processTextAnalysis({ textId: mockTextId, text: mockText });
    expect(updateMock).not.toHaveBeenCalled();
    (textProcessor as any).isShuttingDown = false;
  });

  it('should emit text:created event and call processTextAnalysis', () => {
    const spy = jest.spyOn(textProcessor, 'emit');
    textProcessor.emitTextCreated(mockTextId, mockText);
    expect(spy).toHaveBeenCalledWith('text:created', { textId: mockTextId, text: mockText });
  });
});
