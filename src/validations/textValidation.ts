import Joi from 'joi';

export const createTextSchema = Joi.object({
  text: Joi.string()
    .trim()
    .min(1)
    .max(50000)
    .required()
    .messages({
      'string.empty': 'Text cannot be empty',
      'string.min': 'Text must be at least 1 character long',
      'string.max': 'Text cannot exceed 50000 characters',
      'any.required': 'Text is required'
    })
});
