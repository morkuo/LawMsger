const router = require('express').Router();
const {
  checkJwt,
  checkJson,
  checkRole,
  validate,
  signInRule,
  createUserRule,
  updateUserPasswordRule,
  deleteUserRule,
} = require('../middlewares/validation');
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
  .post(tryCatch(checkJwt), checkRole, checkJson, createUserRule(), tryCatch(createUser))
  .put(tryCatch(checkJwt), checkJson, updateUserPasswordRule(), tryCatch(updateUserPassword))
  .delete(tryCatch(checkJwt), checkRole, checkJson, deleteUserRule(), tryCatch(deleteUser));

router.post('/user/signin', checkJson, signInRule(), tryCatch(signIn));

router.post('/user/picture', tryCatch(checkJwt), upload.any('images'), tryCatch(updateUserPicture));

module.exports = router;
