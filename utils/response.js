 // utils/response.js

module.exports = {
  
  success(res, message = "Success", data = null) {
    return res.status(200).json({
      success: true,
      message,
      data
    });
  },

  created(res, message = "Created", data = null) {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  },

  error(res, message = "Something went wrong", code = 400) {
    return res.status(code).json({
      success: false,
      message
    });
  }
};
