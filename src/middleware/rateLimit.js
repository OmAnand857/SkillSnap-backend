const rateLimit = require('express-rate-limit');

const executeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many execute requests, please try again later.' },
});

module.exports = { executeLimiter };
