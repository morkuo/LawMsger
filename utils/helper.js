const promisify = require('util').promisify;
const jwt = require('jsonwebtoken');

function tryCatch(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

const jwtSign = promisify(jwt.sign);
const jwtVerify = promisify(jwt.verify);

module.exports = {
  tryCatch,
  jwtSign,
  jwtVerify,
};
