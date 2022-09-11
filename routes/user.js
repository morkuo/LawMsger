const router = require('express').Router();
const { checkJwt, checkJson, checkRole } = require('../middlewares/validation');
const { body: check } = require('express-validator');
const { tryCatch } = require('../utils/helper');
const {
  signIn,
  createUser,
  getUserData,
  updateUserData,
  deleteUser,
} = require('../controllers/user');
require('dotenv').config();

router
  .route('/user')
  .get(tryCatch(checkJwt), tryCatch(getUserData))
  .post(
    tryCatch(checkJwt),
    tryCatch(checkRole),
    tryCatch(checkJson),
    check('name')
      .isString()
      .withMessage('string not found')
      .bail()
      .trim()
      .isLength({
        min: process.env.AUTH_USERNAME_MIN_LENGTH,
        max: process.env.AUTH_USERNAME_MAX_LENGTH,
      })
      .withMessage(
        `min length: ${process.env.AUTH_USERNAME_MIN_LENGTH}, max length: ${process.env.AUTH_USERNAME_MAX_LENGTH}`
      )
      .bail()
      .isAlphanumeric()
      .withMessage('only english letters and number')
      .bail(),
    check('email')
      .isEmail()
      .withMessage('wrong email format')
      .bail()
      .normalizeEmail({ gmail_remove_dots: false }),
    check('password')
      .isString()
      .withMessage('string not found')
      .bail()
      .trim()
      .isLength({
        min: process.env.AUTH_PASSWORD_MIN_LENGTH,
        max: process.env.AUTH_PASSWORD_MAX_LENGTH,
      })
      .withMessage(
        `min length: ${process.env.AUTH_PASSWORD_MIN_LENGTH}, max length: ${process.env.AUTH_PASSWORD_MAX_LENGTH}`
      )
      .bail(),
    tryCatch(createUser)
  )
  .put(tryCatch(checkJwt), tryCatch(updateUserData))
  .delete(tryCatch(checkJwt), tryCatch(deleteUser));

router.post('/user/signin', tryCatch(signIn));

module.exports = router;
