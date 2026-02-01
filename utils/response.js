const successResponse = (res, statusCode, data, meta = null) => {
  const response = { success: true, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

const errorResponse = (res, statusCode, message, code = "ERROR") => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
    },
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
