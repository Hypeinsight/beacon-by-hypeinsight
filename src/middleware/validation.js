const { body, validationResult } = require('express-validator');

// Validation rules for tracking events
const trackEventValidation = [
  body('event').notEmpty().trim().withMessage('Event name is required'),
  body('userId').optional().trim(),
  body('sessionId').optional().trim(),
  body('properties').optional().isObject().withMessage('Properties must be an object'),
  body('timestamp').optional().isISO8601().withMessage('Invalid timestamp format'),
];

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = {
  trackEventValidation,
  validate,
};
