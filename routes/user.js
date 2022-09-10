const router = require('express').Router();
const checkJwt = require('../middlewares/checkJwt');
const { tryCatch } = require('../utils/helper');
const {
  signIn,
  createUser,
  getUserData,
  updateUserData,
  deleteUser,
} = require('../controllers/user');

router.post('/user', tryCatch(checkJwt), tryCatch(createUser));

router.post('/user/signin', tryCatch(signIn));

router.get('/user', tryCatch(checkJwt), tryCatch(getUserData));

router.put('/user', tryCatch(checkJwt), tryCatch(updateUserData));

router.delete('/user', tryCatch(checkJwt), tryCatch(deleteUser));

module.exports = router;
