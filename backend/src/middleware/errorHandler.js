function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error]', err);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { errorHandler, asyncHandler };
