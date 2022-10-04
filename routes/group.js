const router = require('express').Router();
const { checkJwt, checkJson, validate } = require('../middlewares/validation');
const { body: check } = require('express-validator');
const { tryCatch } = require('../utils/helper');
const {
  createGroup,
  getGroup,
  getGroupParticipants,
  updateParticipants,
  leaveGroup,
} = require('../controllers/group');

router.use(tryCatch(checkJwt));

router.get('/group', tryCatch(getGroup));

router.get('/group/participants', tryCatch(getGroupParticipants));

router.post(
  '/group',
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
  validate,
  tryCatch(createGroup)
);

router.put(
  '/group',
  tryCatch(checkJson),
  check('groupName')
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
  check('userIds').isArray().withMessage('array not found'),
  validate,
  tryCatch(updateParticipants)
);

router.put(
  '/group/leave',
  tryCatch(checkJson),
  check('groupName')
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
  validate,
  tryCatch(leaveGroup)
);

module.exports = router;
