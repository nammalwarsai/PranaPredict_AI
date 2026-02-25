function errorHandler(err, req, res, next) {
  console.error("Error:", err.message, err.stack);

  const statusCode = err.statusCode || 500;

  // Never leak internal details in production
  const isProduction = process.env.NODE_ENV === "production";
  const clientMessage =
    statusCode === 500 && isProduction
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: clientMessage,
  });
}

module.exports = errorHandler;
