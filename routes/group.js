const router = require('express').Router();
const {
  checkJwt,
  checkJson,
  createGroupRule,
  updateParticipantsRule,
  deleteParticipantsRule,
  leaveGroupRule,
} = require('../middlewares/validation');
const { tryCatch } = require('../utils/helper');
const {
  createGroup,
  getGroup,
  getGroupParticipants,
  updateParticipants,
  deleteParticipants,
  leaveGroup,
} = require('../controllers/group');

router.use(checkJwt);

router.get('/group', tryCatch(getGroup));

router.get('/group/participants', tryCatch(getGroupParticipants));

router.use(checkJson);

router
  .route('/group')
  .post(createGroupRule(), tryCatch(createGroup))
  .put(updateParticipantsRule(), tryCatch(updateParticipants))
  .delete(deleteParticipantsRule(), tryCatch(deleteParticipants));

router.put('/group/leave', leaveGroupRule(), tryCatch(leaveGroup));

module.exports = router;
