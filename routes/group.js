const router = require('express').Router();
const {
  checkJwt,
  checkJson,
  createGroupRule,
  addParticipantsRule,
  deleteParticipantsRule,
  leaveGroupRule,
} = require('../middlewares/validation');
const { tryCatch } = require('../utils/helper');
const {
  createGroup,
  getGroup,
  getGroupParticipants,
  addParticipants,
  deleteParticipants,
  leaveGroup,
} = require('../controllers/group');

router.use(checkJwt);

router
  .route('/group')
  .get(tryCatch(getGroup))
  .post(checkJson, createGroupRule(), tryCatch(createGroup));

router
  .route('/group/participants')
  .get('/group/participants', tryCatch(getGroupParticipants))
  .put(checkJson, addParticipantsRule(), tryCatch(addParticipants))
  .delete(checkJson, deleteParticipantsRule(), tryCatch(deleteParticipants));

router.put('/group/leave', leaveGroupRule(), tryCatch(leaveGroup));

module.exports = router;
