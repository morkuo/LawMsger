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
  return async (socket, next) => {
    try {
      await cb(socket, next);
    } catch (error) {
      if (next) next(error);
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
