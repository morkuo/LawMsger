const router = require('express').Router();
const { checkJwt, checkJson } = require('../middlewares/validation');
const { body: check } = require('express-validator');
const { tryCatch } = require('../utils/helper');
const { createGroup, getGroup } = require('../controllers/group');

router.get('/group', tryCatch(checkJwt), tryCatch(getGroup));
router.post(
  '/group',
  tryCatch(checkJwt),
  tryCatch(checkJson),
  check('name')
    .isString()
    .withMessage('string not found')
    .bail()
    .trim()
    .isLength({
      min: process.env.GROUP_NAME_MIN_LENGTH,
      max: process.env.GROUP_NAME_MAX_LENGTH,
    })
    .withMessage(
      `min length: ${process.env.GROUP_NAME_MIN_LENGTH}, max length: ${process.env.GROUP_NAME_MAX_LENGTH}`
    )
    .bail()
    .escape(),
  tryCatch(createGroup)
);

module.exports = router;
