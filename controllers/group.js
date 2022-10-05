const es = require('../utils/es');
const {
  getGroupByName,
  getGroupCountByName,
  getParticipatedGroups,
  getUnreadGroupMessage,
  deleteGroupById,
  updateParticipants,
} = require('../models/group');
const { getUsersByIds } = require('../models/user');
const { getAllUser } = require('../models/user');
const { customError } = require('../utils/error');
require('dotenv').config;

const createGroup = async (req, res) => {
  const { name } = req.body;
  const { organizationId, id: userId } = req.userdata;

  //check whether the name has been used
  const resultCount = await getGroupCountByName(organizationId, name);

  if (resultCount) return res.status(409).json({ error: 'group exists' });

  const result = await es[organizationId].index({
    index: 'group',
    document: {
      host: userId,
      name,
      participants: [userId],
    },
  });

  res.status(201).json({
    data: 'created',
    group: {
      id: result._id,
    },
  });
};

const getGroup = async (req, res) => {
  const { organizationId, id: userId } = req.userdata;

  const result = await getParticipatedGroups(organizationId, userId);

  const groupIds = result.map(group => ({ term: { group_id: group._id } }));

  const unreadMessages = await getUnreadGroupMessage(organizationId, userId, groupIds);

  let unreadMessagesCount = {};
  unreadMessages.forEach(msg => {
    if (!(msg._source.group_id in unreadMessagesCount))
      unreadMessagesCount[msg._source.group_id] = 1;
    else unreadMessagesCount[msg._source.group_id]++;
  });

  const groups = result
    .map(group => ({
      id: group._id,
      host: group._source.host,
      name: group._source.name,
      participants: group._source.participants,
      unread: unreadMessagesCount[group._id] || 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  res.json(groups);
};

const getGroupParticipants = async (req, res) => {
  const { groupName } = req.query;
  const { organizationId } = req.userdata;

  const resultGroup = await getGroupByName(organizationId, groupName);

  const usersIds = resultGroup._source.participants.map(userId => ({ term: { _id: userId } }));

  const result = await getUsersByIds(organizationId, usersIds);

  res.json(
    result.map(user => ({
      name: user._source.name,
      email: user._source.email,
      picture: user._source.picture,
    }))
  );
};

const addParticipants = async (req, res) => {
  const { groupName, userIds } = req.body;
  const { organizationId, id: hostUserId } = req.userdata;

  const result = await getGroupByName(organizationId, groupName);

  try {
    checkUpdateSafety(result, hostUserId, newParticipants);
  } catch (error) {
    return res.status(error.status).json(error.msg);
  }

  //check whether userIds exist
  const resultUser = await getAllUser(organizationId);

  const usersExisting = resultUser.map(user => user._id);

  for (const userId of userIds) {
    if (!usersExisting.includes(userId)) return res.status(400).json({ error: 'wrong user ids' });
  }

  //create new participants array
  const newParticipants = [...result._source.participants, ...userIds];
  const resultUpdate = await updateParticipants(organizationId, groupName, newParticipants);

  if (!resultUpdate.updated) return res.status(500).json({ error: 'server error' });

  res.json({
    data: 'updated',
    group: {
      id: result._id,
    },
  });
};

const deleteParticipants = async (req, res) => {
  const { groupName, userIds } = req.body;
  const { organizationId, id: hostUserId } = req.userdata;

  const result = await getGroupByName(organizationId, groupName);

  //check whether the group exist
  if (!result) return res.status(400).json({ error: 'group not found' });

  //check whether the request is send from host of the group
  if (result._source.host !== hostUserId) {
    return res.status(403).json({ error: 'forbidden' });
  }

  //check whether userIds include host Id
  if (userIds.includes(result._source.host)) {
    return res.status(400).json({ error: 'users should not include host user' });
  }

  const currentParticipants = result._source.participants;

  //check target users are current participants
  const isAllParticipants = userIds.every(userId => currentParticipants.includes(userId));
  if (!isAllParticipants) return res.status(400).json({ error: 'some user are not member' });

  //create new participants array
  const participants = result._source.participants;
  const newParticipants = participants.filter(
    currentParticipant => !userIds.includes(currentParticipant)
  );

  const resultUpdate = await updateParticipants(organizationId, groupName, newParticipants);

  if (!resultUpdate.updated) return res.status(500).json({ error: 'server error' });

  return res.json({
    data: 'deleted',
    group: {
      id: result._id,
    },
  });
};

const leaveGroup = async (req, res) => {
  const { groupName } = req.body;
  const { organizationId, id: userId } = req.userdata;

  const result = await getGroupByName(organizationId, groupName);

  //check whether the group exist
  if (!result) return res.status(400).json({ error: 'group not found' });

  //if current user is the host, delete the group
  if (result._source.host === userId) {
    const resultUpdate = await deleteGroupById(organizationId, result._id);

    if (!resultUpdate.deleted) return res.status(500).json({ error: 'server error' });

    return res.json({ data: 'deleted' });
  }

  //create new participants array
  const participants = result._source.participants;
  const newParticipants = participants.filter(currentParticipant => currentParticipant !== userId);

  const resultUpdate = await updateParticipants(organizationId, groupName, newParticipants);

  if (!resultUpdate.updated) return res.status(500).json({ error: 'server error' });

  res.json({ data: 'updated' });
};

function checkUpdateSafety(targetGroup, hostUserId, newParticipants) {
  const {
    _source: { host },
  } = targetGroup;

  if (!targetGroup) throw new customError('group not found', 400);
  if (host !== hostUserId) throw new customError('forbidden', 403);
  if (newParticipants.includes(host)) {
    throw new customError('users should not include host user', 400);
  }

  return true;
}

module.exports = {
  createGroup,
  getGroup,
  getGroupParticipants,
  addParticipants,
  deleteParticipants,
  leaveGroup,
};
