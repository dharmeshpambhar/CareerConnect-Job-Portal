class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (err, req, res, next) => {
  // Normalize err to always be an ErrorHandler instance
  if (typeof err === "string") {
    err = new ErrorHandler(err, 500);
  } else if (!(err instanceof Error)) {
    err = new ErrorHandler("Internal Server Error", 500);
  }

  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;

  // Handle invalid MongoDB ObjectId
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid value for field: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
    err = new ErrorHandler(message, 400);
  }

  // Handle invalid JWT
  if (err.name === "JsonWebTokenError") {
    const message = `Json Web Token is invalid, Try again please!`;
    err = new ErrorHandler(message, 400);
  }

  // Handle expired JWT
  if (err.name === "TokenExpiredError") {
    const message = `Json Web Token is expired, Try again please!`;
    err = new ErrorHandler(message, 400);
  }

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export default ErrorHandler;
