const jwt = require('jsonwebtoken');

const getUsageUserKey = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const headerUserId = req.headers['x-user-id'];

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.usageUserKey = decoded.id;
      return next();
    } catch (error) {
      // Social login currently stores provider access tokens, so fall back to
      // the saved provider user id sent by the app.
    }
  }

  if (headerUserId) {
    req.usageUserKey = headerUserId;
    return next();
  }

  return res.status(401).json({
    message: 'Login required',
  });
};

module.exports = getUsageUserKey;
