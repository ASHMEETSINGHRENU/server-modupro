function notFoundHandler(req, res, _next) {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const isProd = process.env.NODE_ENV === 'production';

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with that ${duplicateField} already exists.`,
    });
  }

  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: details[0] || 'Validation failed.',
      errors: details,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
    ...(isProd ? {} : { details: err.stack }),
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
