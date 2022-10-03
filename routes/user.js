const router = require('express').Router();
const { checkJwt, checkJson, checkRole, validate } = require('../middlewares/validation');
const { body: check } = require('express-validator');
const { upload } = require('../middlewares/multer');
const { tryCatch } = require('../utils/helper');
const {
  signIn,
  createUser,
  getUserData,
  updateUserPassword,
  updateUserPicture,
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
      .isAlpha()
      .withMessage('only english letters'),
    check('email')
      .isEmail()
      .withMessage('wrong email format')
      .bail()
      .normalizeEmail({ gmail_remove_dots: false }),
    check('password')
      .isString()
      .withMessage('string not found')
      .bail()
      .isLength({
        min: process.env.AUTH_PASSWORD_MIN_LENGTH,
        max: process.env.AUTH_PASSWORD_MAX_LENGTH,
      })
      .withMessage(
        `min length: ${process.env.AUTH_PASSWORD_MIN_LENGTH}, max length: ${process.env.AUTH_PASSWORD_MAX_LENGTH}`
      ),
    validate,
    tryCatch(createUser)
  )
  .put(
    tryCatch(checkJwt),
    tryCatch(checkJson),
    check('oldPassword')
      .isString()
      .withMessage('string not found')
      .bail()
      .isLength({
        min: process.env.AUTH_PASSWORD_MIN_LENGTH,
        max: process.env.AUTH_PASSWORD_MAX_LENGTH,
      })
      .withMessage(
        `min length: ${process.env.AUTH_PASSWORD_MIN_LENGTH}, max length: ${process.env.AUTH_PASSWORD_MAX_LENGTH}`
      ),
    check('newPassword')
      .isString()
      .withMessage('string not found')
      .bail()
      .isLength({
        min: process.env.AUTH_PASSWORD_MIN_LENGTH,
        max: process.env.AUTH_PASSWORD_MAX_LENGTH,
      })
      .withMessage(
        `min length: ${process.env.AUTH_PASSWORD_MIN_LENGTH}, max length: ${process.env.AUTH_PASSWORD_MAX_LENGTH}`
      ),
    validate,
    tryCatch(updateUserPassword)
  )
  .delete(
    tryCatch(checkJwt),
    tryCatch(checkRole),
    tryCatch(checkJson),
    check('email')
      .isEmail()
      .withMessage('wrong email format')
      .bail()
      .normalizeEmail({ gmail_remove_dots: false }),
    validate,
    tryCatch(deleteUser)
  );

router.post(
  '/user/signin',
  tryCatch(checkJson),
  check('email')
    .isEmail()
    .withMessage('wrong email format')
    .bail()
    .normalizeEmail({ gmail_remove_dots: false }),
  check('password')
    .isString()
    .withMessage('string not found')
    .bail()
    .isLength({
      min: process.env.AUTH_PASSWORD_MIN_LENGTH,
      max: process.env.AUTH_PASSWORD_MAX_LENGTH,
    })
    .withMessage(
      `min length: ${process.env.AUTH_PASSWORD_MIN_LENGTH}, max length: ${process.env.AUTH_PASSWORD_MAX_LENGTH}`
    ),
  validate,
  tryCatch(signIn)
);

router.post('/user/picture', tryCatch(checkJwt), upload.any('images'), tryCatch(updateUserPicture));

module.exports = router;
