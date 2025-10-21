const successResponse = (res, data = [], message = "Successfully performed action", statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      statusCode
    });
  };
  
  const errorResponse = (res, message = "Error occurred", statusCode = 500) => {
    return res.status(statusCode).json({
      success: false,
      message,
      statusCode
    });
  };
  
  module.exports = { successResponse, errorResponse };
  