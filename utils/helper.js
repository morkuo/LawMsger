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

function socketTryCatch(cb) {
  return async (...args) => {
    try {
      await cb(...args);
    } catch (error) {
      console.log(error.message);
    }
  };
}

const jwtSign = promisify(jwt.sign);
const jwtVerify = promisify(jwt.verify);

module.exports = {
  tryCatch,
  socketTryCatch,
  jwtSign,
  jwtVerify,
};
