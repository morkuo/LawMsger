const es = require('../utils/es');
const {
  suggestions,
  matchedClauses,
  createMessage,
  updateOneGroupMessageIsRead,
  updateMatchedClauseSearchTime,
} = require('../models/message');
const {
  createStarredUser,
  getOneStarredUserFromSpecificUser,
  deleteStarredUserFromSpecificUser,
} = require('../models/contact');
const { getUsersByIds, getUserByEmailAsYouType } = require('../models/user');
const { pubClient } = require('../utils/redis');
require('dotenv').config();

let io;

function msg(socket) {
  socket.on('msg', async (msg, targetSocketId, targetUserId, targetUserName, filesInfo) => {
    const fromSocketId = socket.id;
    const fromUserId = socket.userdata.id;
    const fromUserName = socket.userdata.name;

    const allSockets = await io.allSockets();
    console.log(allSockets.has(targetSocketId));

    if (!allSockets.has(targetSocketId)) {
      const parsedFilesInfo = await JSON.parse(filesInfo);
      parsedFilesInfo.data.forEach(fileObj => {
        //S3 presigned url which is going to expires
        delete fileObj.location;
      });
      await es[socket.userdata.organizationId].index({
        index: 'message',
        document: {
          sender_id: fromUserId,
          sender_name: fromUserName,
          receiver_id: targetUserId,
          receiver_name: targetUserName,
          message: msg,
          files: JSON.stringify(parsedFilesInfo),
          isRead: false,
        },
      });
    } else {
      io.to(targetSocketId).emit(
        'checkChatWindow',
        msg,
        fromSocketId,
        fromUserId,
        fromUserName,
        targetSocketId,
        targetUserId,
        targetUserName,
        filesInfo
      );
    }
  });
}

function groupMsg(socket) {
  socket.on('groupmsg', async (msg, groupId, filesInfo) => {
    const fromSocketId = socket.id;
    const fromUserId = socket.userdata.id;
    const fromUserName = socket.userdata.name;

    const result = await es[socket.userdata.organizationId].index({
      index: 'groupmessage',
      document: {
        group_id: groupId,
        sender_id: fromUserId,
        sender_name: fromUserName,
        message: msg,
        files: filesInfo,
        isRead: [socket.userdata.id],
      },
    });

    io.to(groupId).emit(
      'checkGroupChatWindow',
      msg,
      fromSocketId,
      fromUserId,
      fromUserName,
      groupId,
      result._id,
      filesInfo
    );
  });
}

async function checkChatWindow(socket) {
  socket.on(
    'checkChatWindow',
    async (
      msg,
      fromSocketId,
      fromUserId,
      fromUserName,
      targetSocketId,
      targetUserId,
      targetUserName,
      filesInfo,
      isAtWindow
    ) => {
      const { organizationId } = socket.userdata;

      const parsedFilesInfo = await JSON.parse(filesInfo);
      parsedFilesInfo.data.forEach(fileObj => {
        //S3 presigned url which is going to expires
        delete fileObj.location;
      });

      let isRead = true;
      if (!isAtWindow) isRead = false;

      const allSockets = await io.allSockets();
      console.log('all sockets: ' + allSockets.has(targetSocketId));
      console.log('target SocketId:' + targetSocketId);

      await createMessage(
        organizationId,
        fromUserId,
        fromUserName,
        targetUserId,
        targetUserName,
        msg,
        JSON.stringify(parsedFilesInfo),
        isRead
      );
    }
  );
}

async function checkGroupChatWindow(socket) {
  socket.on('checkGroupChatWindow', async (receiverUserId, messageId) => {
    const { organizationId } = socket.userdata;
    await updateOneGroupMessageIsRead(organizationId, receiverUserId, messageId);
  });
}

async function setOnlineStatus(socket) {
  io.emit('onlineStatus', socket.userdata.id, socket.id, 'on');

  await pubClient.hset('onlineUsers', [socket.userdata.id, socket.id]);
  console.log('new socket connected: ' + socket.id);
}

async function joinGroup(socket) {
  socket.on('join', async groups => {
    const groupIds = groups.map(group => group.id);

    socket.join(groupIds);
  });
}

async function joinFirm(socket) {
  socket.on('joinFirm', async firmId => {
    socket.join(firmId);
  });
}

async function drawGroupDiv(socket) {
  socket.on('drawGroupDiv', async (newParticipantsUserId, hostId, groupId, groupName) => {
    const { organizationId } = socket.userdata;

    const onlineUsers = await pubClient.hgetall('onlineUsers');

    const socketIdsOnline = newParticipantsUserId
      .map(userId => onlineUsers[userId])
      .filter(userId => userId !== undefined);

    if (!socketIdsOnline.length) return;

    const participantsUserId = [hostId, ...newParticipantsUserId];

    const usersQuery = participantsUserId.map(userId => ({ term: { _id: userId } }));

    const result = await getUsersByIds(organizationId, usersQuery);

    const participants = result.map(user => ({
      name: user._source.name,
      email: user._source.email,
      picture: user._source.picture,
    }));

    io.to(socketIdsOnline).emit('drawGroupDiv', groupId, groupName, hostId, participants);
  });
}

async function deleteGroupDiv(socket) {
  socket.on('deleteGroupDiv', async (userIds, groupId) => {
    //host dissolved the group
    if (!userIds) return io.to(groupId).emit('deleteGroupDiv', groupId);

    const onlineUsers = await pubClient.hgetall('onlineUsers');

    //host deleted certain member
    const socketIdsOnline = userIds
      .map(userId => onlineUsers[userId])
      .filter(userId => userId !== undefined);

    if (!socketIdsOnline.length) return;

    io.to(socketIdsOnline).emit('deleteGroupDiv', groupId);
  });
}

async function disconnection(socket) {
  socket.on('disconnect', async () => {
    io.emit('onlineStatus', socket.userdata.id, socket.id, 'off');

    await pubClient.hdel('onlineUsers', socket.userdata.id);

    console.log('user disconnected: ' + socket.id);
  });
}

async function createStarContact(socket) {
  socket.on('createStarContact', async targetContactUserId => {
    const { organizationId, id: userId } = socket.userdata;

    const isDuplicate = await getOneStarredUserFromSpecificUser(
      organizationId,
      userId,
      targetContactUserId
    );

    if (isDuplicate.length) return socket.emit('createStarContact', { error: 'star exists' });

    const result = await createStarredUser(organizationId, userId, targetContactUserId);

    socket.emit('createStarContact', {
      data: { result: result.result, targetContactUserId },
    });
  });
}

async function deleteStarContact(socket) {
  socket.on('deleteStarContact', async targetContactUserId => {
    const { organizationId, id: userId } = socket.userdata;

    const result = await deleteStarredUserFromSpecificUser(
      organizationId,
      userId,
      targetContactUserId
    );

    if (!result.deleted) {
      socket.emit('deleteStarContact', {
        error: 'failed',
      });
    }

    socket.emit('deleteStarContact', {
      data: targetContactUserId,
    });
  });
}

async function searchClausesByArticle(socket) {
  socket.on('suggestion', async (input, index) => {
    const result = await suggestions(socket.userdata.organizationId, input, index);

    if (!index) socket.emit('suggestion', result);
    else socket.emit('clauses', result);
  });
}

async function searchClausesByContent(socket) {
  socket.on('matchedClauses', async input => {
    if (!input) return;
    const result = await matchedClauses(socket.userdata.organizationId, input);

    socket.emit('matchedClauses', result);
  });
}

async function updateClausesLastSearchTime(socket) {
  socket.on('updateMatchedClauses', async (origin, title, number) => {
    try {
      const { organizationId } = socket.userdata;
      await updateMatchedClauseSearchTime(organizationId, origin, title, number);
    } catch (error) {
      console.log(error);
    }
  });
}

async function searchEamil(socket) {
  socket.on('searchEamil', async input => {
    const { organizationId } = socket.userdata;

    console.log('current organizationId: ' + organizationId);

    const result = await getUserByEmailAsYouType(organizationId, input);

    const users = result.map(user => ({
      id: user._id,
      name: user._source.name,
      email: user._source.email,
      picture: user._source.picture,
    }));

    socket.emit('searchEamil', users);
  });
}

async function changeProfilePicture(socket) {
  socket.on('changeProfilePicture', async userId => {
    io.emit('changeProfilePicture', userId);
  });
}

async function changeFirmPicture(socket) {
  socket.on('changeFirmPicture', async firmId => {
    io.to(firmId).emit('changeFirmPicture', firmId);
  });
}

module.exports = ioServer => {
  io = ioServer;

  return {
    setOnlineStatus,
    joinGroup,
    joinFirm,
    drawGroupDiv,
    deleteGroupDiv,
    msg,
    groupMsg,
    searchClausesByArticle,
    searchClausesByContent,
    matchedClauses,
    updateClausesLastSearchTime,
    checkChatWindow,
    checkGroupChatWindow,
    createStarContact,
    deleteStarContact,
    searchEamil,
    changeProfilePicture,
    changeFirmPicture,
    disconnection,
  };
};
