import { Request, Response, NextFunction } from 'express';
import Text from '../models/Text';
import { ApiResponse, TextDocument } from '../types';
import mongoose from 'mongoose';
import { textProcessor } from '../events/textProcessor';
import { createPaginationMeta } from '../middlewares/pagination';

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

export interface ListTextsQuery {
  done?: 'true' | 'false' | 'all';
}

export const listTexts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { done } = req.query as ListTextsQuery;
    const pagination = req.pagination;

    if (!pagination) {
      res.status(500).json({
        success: false,
        message: 'Pagination middleware not configured',
      });

      return
    }

    // Build filter based on done parameter
    let filter: any = {};
    if (done === 'true') {
      filter.done = true;
    } else if (done === 'false') {
      filter.done = false;
    }
    // If done is 'all' or undefined, don't add done filter

    // Build sort object
    const sortField = pagination.orderBy[0]; // We only allow one field for ordering
    const sortOrder = pagination.order === 'desc' ? -1 : 1;
    const sort: any = {};
    sort[sortField] = sortOrder;

    // Get total count for pagination metadata
    const totalCount = await Text.countDocuments(filter);

    // Fetch paginated results
    const texts = await Text.find(filter)
      .sort(sort)
      .skip(pagination.offset)
      .limit(pagination.limit)
      .lean(); // Use lean() for better performance since we don't need document methods

    // Create pagination metadata
    const paginationMeta = createPaginationMeta(
      pagination.page,
      pagination.limit,
      totalCount
    );

    const response: ApiResponse<ITextDocument[]> = {
      success: true,
      data: texts as ITextDocument[],
      message: 'Texts retrieved successfully',
      meta: paginationMeta,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
