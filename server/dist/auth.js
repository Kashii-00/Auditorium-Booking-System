// middleware/auth.js
const jwt = require('jsonwebtoken');
const secret = "KASHIKA2006LK"; // Replace with a secure secret or use an environment variable

module.exports = (req, res, next) => {
  // The token is expected in the Authorization header as "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      error: 'No token provided'
    });
  }
  const token = authHeader.split(' ')[1]; // Extract the token

  try {
    // Verify the token
    const decoded = jwt.verify(token, secret);
    // Attach user information to the request object (assuming the payload includes the user id)
    req.user = decoded;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }
};