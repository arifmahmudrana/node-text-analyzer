import { Request, Response, NextFunction } from 'express';
import Text from '../models/Text';
import { ApiResponse, TextDocument } from '../types';
import mongoose from 'mongoose';
import { textProcessor } from '../events/textProcessor';

export interface ITextDocument {
  _id: mongoose.Types.ObjectId;
  text: string;
  done: boolean;
  numberOfWords?: number;
  numberOfCharacters?: number;
  numberOfSentences?: number;
  numberOfParagraphs?: number;
  longestWordsInParagraphs?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const createText = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const textData: Partial<TextDocument> = req.body;
    const text = new Text(textData);
    await text.save();

    // Emit event for async text processing
    textProcessor.emitTextCreated(text._id, text.text);

    const response: ApiResponse<ITextDocument> = {
      success: true,
      data: text.toObject(),
      message: 'Text created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const getTextById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({
        success: false,
        message: 'Text not found',
      });

      return;
    }

    // Find text document with done: true
    const text = await Text.findOne({ 
      _id: id, 
      done: true 
    });

    if (!text) {
      res.status(404).json({
        success: false,
        message: 'Text not found',
      });

      return;
    }

    const response: ApiResponse<ITextDocument> = {
      success: true,
      data: text.toObject(),
      message: 'Text retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
