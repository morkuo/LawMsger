const router = require('express').Router();
const {
  checkJwt,
  checkJson,
  checkRole,
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

router.post('/user/signin', checkJson, signInRule(), tryCatch(signIn));

router.use(checkJwt);

router
  .route('/user')
  .get(tryCatch(getUserData))
  .post(checkRole, checkJson, createUserRule(), tryCatch(createUser))
  .put(checkJson, updateUserPasswordRule(), tryCatch(updateUserPassword))
  .delete(checkRole, checkJson, deleteUserRule(), tryCatch(deleteUser));

router.post('/user/picture', upload.any('images'), tryCatch(updateUserPicture));

module.exports = router;
