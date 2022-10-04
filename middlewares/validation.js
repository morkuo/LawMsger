const { body: check, validationResult } = require('express-validator');
const { jwtVerify } = require('../utils/helper');
require('dotenv').config();

const {
  AUTH_PASSWORD_MIN_LENGTH,
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_USERNAME_MIN_LENGTH,
  AUTH_USERNAME_MAX_LENGTH,
  GROUP_NAME_MIN_LENGTH,
  GROUP_NAME_MAX_LENGTH,
} = process.env;

async function checkJwt(req, res, next) {
  let token = req.get('Authorization');

  //check authorization type
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'no token found' });
  }

  //remove type string
  token = token.replace('Bearer ', '');

  //parse token to retrieve userdata
  try {
    req.userdata = await jwtVerify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'wrong token' });
  }

  next();
}

function checkJson(req, res, next) {
  if (!req.is('application/json')) return res.status(400).json({ error: 'not json type' });
  next();
}

function checkRole(req, res, next) {
  if (req.userdata.role !== -1) return res.status(403).json({ error: 'forbidden' });
  next();
}

const checkEmail = check('email')
  .isEmail()
  .withMessage('wrong email format')
  .bail()
  .normalizeEmail();

const checkPassword = passwordFieldName =>
  check(passwordFieldName)
    .isString()
    .withMessage('string not found')
    .bail()
    .isLength({
      min: AUTH_PASSWORD_MIN_LENGTH,
      max: AUTH_PASSWORD_MAX_LENGTH,
    })
    .withMessage(
      `min length: ${AUTH_PASSWORD_MIN_LENGTH}, max length: ${AUTH_PASSWORD_MAX_LENGTH}`
    );

const checkGroupName = groupNameField =>
  check(groupNameField)
    .isString()
    .withMessage('string not found')
    .bail()
    .trim()
    .isLength({
      min: GROUP_NAME_MIN_LENGTH,
      max: GROUP_NAME_MAX_LENGTH,
    })
    .withMessage(`min length: ${GROUP_NAME_MIN_LENGTH}, max length: ${GROUP_NAME_MAX_LENGTH}`)
    .bail()
    .escape();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array() });

  next();
}

function createUserRule() {
  return [
    check('name')
      .isString()
      .withMessage('string not found')
      .bail()
      .trim()
      .isLength({
        min: AUTH_USERNAME_MIN_LENGTH,
        max: AUTH_USERNAME_MAX_LENGTH,
      })
      .withMessage(
        `min length: ${AUTH_USERNAME_MIN_LENGTH}, max length: ${AUTH_USERNAME_MAX_LENGTH}`
      )
      .bail()
      .isAlpha()
      .withMessage('only english letters'),
    checkEmail,
    checkPassword('password'),
    validate,
  ];
}

function updateUserPasswordRule() {
  return [checkPassword('oldPassword'), checkPassword('newPassword'), validate];
}

function deleteUserRule() {
  return [checkEmail, validate];
}

function signInRule() {
  return [checkEmail, checkPassword('password'), validate];
}

function createGroupRule() {
  return [checkGroupName('name'), validate];
}

function updateParticipantsRule() {
  return [
    checkGroupName('groupName'),
    check('userIds').isArray().withMessage('array not found'),
    validate,
  ];
}

function leaveGroupRule() {
  return [checkGroupName('groupName'), validate];
}

module.exports = {
  checkJwt,
  checkJson,
  checkRole,
  validate,
  signInRule,
  createUserRule,
  updateUserPasswordRule,
  deleteUserRule,
  createGroupRule,
  updateParticipantsRule,
  leaveGroupRule,
};
