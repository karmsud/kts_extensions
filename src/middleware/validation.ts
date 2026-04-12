const { body, param, validationResult } = require('express-validator');
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Deal validation rules
export const dealValidation = [
  body('deal_name')
    .notEmpty()
    .withMessage('Deal name is required')
    .trim()
    .escape()
    .isLength({ min: 1, max: 255 })
    .withMessage('Deal name must be between 1 and 255 characters'),
  body('keyword')
    .notEmpty()
    .withMessage('Keyword is required')
    .trim()
    .escape()
    .isLength({ min: 1, max: 500 })
    .withMessage('Keyword must be between 1 and 500 characters'),
  body('servicer_id')
    .isInt({ min: 1 })
    .withMessage('Servicer ID must be a positive integer'),
  body('item_id')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 100 })
    .withMessage('Item ID must not exceed 100 characters'),
  validateRequest
];

// Job validation rules
export const jobValidation = [
  body('job_name')
    .notEmpty()
    .withMessage('Job name is required')
    .trim()
    .escape()
    .isLength({ min: 1, max: 255 })
    .withMessage('Job name must be between 1 and 255 characters'),
  body('mailbox')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail(),
  body('folder')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 255 })
    .withMessage('Folder path must not exceed 255 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'draft'])
    .withMessage('Status must be active, inactive, or draft'),
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
  validateRequest
];

// Job configuration validation
export const jobConfigValidation = [
  body('filters.from')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 255 })
    .withMessage('From filter must not exceed 255 characters'),
  body('filters.subject')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 255 })
    .withMessage('Subject filter must not exceed 255 characters'),
  body('filters.attachments')
    .optional()
    .isIn(['True', 'False'])
    .withMessage('Attachments filter must be True or False'),
  body('parsers.detach_file')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 255 })
    .withMessage('Detach file pattern must not exceed 255 characters'),
  body('parsers.search_by_subject')
    .optional()
    .isBoolean()
    .withMessage('Search by subject must be a boolean'),
  body('parsers.search_by_filename')
    .optional()
    .isBoolean()
    .withMessage('Search by filename must be a boolean'),
  body('servicer_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Servicer ID must be a positive integer'),
  validateRequest
];

// Parameter validation for IDs
export const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  validateRequest
];

// Settings validation
export const settingsValidation = [
  body('emailNotifications')
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('defaultJobStatus')
    .isIn(['active', 'inactive', 'draft'])
    .withMessage('Default job status must be active, inactive, or draft'),
  body('loggingLevel')
    .isIn(['error', 'warn', 'info', 'debug'])
    .withMessage('Logging level must be error, warn, info, or debug'),
  body('retentionPeriod')
    .isInt({ min: 1, max: 365 })
    .withMessage('Retention period must be between 1 and 365 days'),
  body('smtpServer')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 255 })
    .withMessage('SMTP server must not exceed 255 characters'),
  body('smtpPort')
    .optional()
    .isInt({ min: 1, max: 65535 })
    .withMessage('SMTP port must be between 1 and 65535'),
  body('smtpUsername')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 255 })
    .withMessage('SMTP username must not exceed 255 characters'),
  body('smtpPassword')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('SMTP password must not exceed 255 characters'),
  validateRequest
]; 