const es = require('./es');
const { suggestions, matchedClauses } = require('../models/message');
require('dotenv').config();

function msg(io, socket) {
  socket.on('msg', async (msg, targetSocketId, targetUserId, targetUserName, filesInfo) => {
    const fromSocketId = socket.id;
    const fromUserId = socket.userdata.id;
    const fromUserName = socket.userdata.name;

    if (!io.sockets.adapter.rooms.has(targetSocketId)) {
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
      socket
        .to(targetSocketId)
        .emit(
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

function groupMsg(io, socket) {
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

    socket
      .to(groupId)
      .emit(
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

async function checkChatWindow(io, socket) {
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
      const parsedFilesInfo = await JSON.parse(filesInfo);
      parsedFilesInfo.data.forEach(fileObj => {
        //S3 presigned url which is going to expires
        delete fileObj.location;
      });

      let isRead = true;
      if (!isAtWindow) isRead = false;

      socket.to(targetSocketId).emit('msg', msg, fromSocketId, filesInfo);

      await es[socket.userdata.organizationId].index({
        index: 'message',
        document: {
          sender_id: fromUserId,
          sender_name: fromUserName,
          receiver_id: targetUserId,
          receiver_name: targetUserName,
          message: msg,
          files: JSON.stringify(parsedFilesInfo),
          isRead,
        },
      });
    }
  );
}

async function checkGroupChatWindow(io, socket) {
  socket.on('checkGroupChatWindow', async (receiverUserId, messageId) => {
    //add user into isRead array
    const result = await es[socket.userdata.organizationId].update({
      index: 'groupmessage',
      id: messageId,
      script: {
        source: `if(!ctx._source.isRead.contains(params.user_id)){ctx._source.isRead.add(params.user_id)}`,
        lang: 'painless',
        params: {
          user_id: receiverUserId,
        },
      },
      retry_on_conflict: process.env.GROUP_MEMBER_LIMIT,
    });
  });
}

async function setOnlineStatus(socket) {
  socket.broadcast.emit('onlineStatus', socket.userdata.id, socket.id, 'on');

  global.hashTable[socket.userdata.id] = socket.id;

  console.log('new socket connected: ' + socket.id);
}

async function joinGroup(socket, groups) {
  const groupIds = groups.map(group => group.id);

  socket.join(groupIds);
}

async function joinFirm(io, socket) {
  socket.on('joinFirm', async firmId => {
    socket.join(firmId);
  });
}

async function drawGroupDiv(io, socket) {
  socket.on('drawGroupDiv', async (newParticipantsUserId, hostId, groupId, groupName) => {
    const socketIdsOnline = newParticipantsUserId
      .map(userId => global.hashTable[userId])
      .filter(userId => userId !== undefined);

    const participantsUserId = [hostId, ...newParticipantsUserId];

    const usersQuery = participantsUserId.map(userId => ({ term: { _id: userId } }));

    const {
      hits: { hits: resultUsers },
    } = await es[socket.userdata.organizationId].search({
      index: 'user',
      body: {
        size: process.env.ES_SEARCH_LIMIT,
        query: {
          bool: {
            should: usersQuery,
          },
        },
      },
    });

    const participants = resultUsers.map(user => ({
      name: user._source.name,
      email: user._source.email,
      picture: user._source.picture,
    }));

    if (socketIdsOnline.length !== 0) {
      socket.to(socketIdsOnline).emit('drawGroupDiv', groupId, groupName, hostId, participants);
    }
  });
}

async function deleteGroupDiv(io, socket) {
  socket.on('deleteGroupDiv', async (userIds, groupId) => {
    //host dissolved the group
    if (!userIds) return socket.to(groupId).emit('deleteGroupDiv', groupId);

    //host deleted certain member
    const socketIdsOnline = userIds
      .map(userId => global.hashTable[userId])
      .filter(userId => userId !== undefined);

    if (socketIdsOnline.length !== 0) {
      socket.to(socketIdsOnline).emit('deleteGroupDiv', groupId);
    }
  });
}

async function disconnection(io, socket) {
  socket.on('disconnect', async () => {
    socket.broadcast.emit('onlineStatus', socket.userdata.id, socket.id, 'off');

    delete global.hashTable[socket.userdata.id];

    console.log('user disconnected: ' + socket.id);
  });
}

async function createStarContact(io, socket) {
  socket.on('createStarContact', async targetContactUserId => {
    const {
      hits: { hits: resultCheckDuplicate },
    } = await es[socket.userdata.organizationId].search({
      index: 'star',
      body: {
        query: {
          bool: {
            filter: [
              { term: { user_id: socket.userdata.id } },
              { term: { contact_user_id: targetContactUserId } },
            ],
          },
        },
      },
    });

    if (resultCheckDuplicate.length !== 0) {
      return socket.emit('createStarContact', { error: 'star exists' });
    }

    const result = await es[socket.userdata.organizationId].index({
      index: 'star',
      document: {
        user_id: socket.userdata.id,
        contact_user_id: targetContactUserId,
      },
    });

    // console.log(result);

    socket.emit('createStarContact', {
      data: { result: result.result, targetContactUserId },
    });
  });
}

async function deleteStarContact(io, socket) {
  socket.on('deleteStarContact', async targetContactUserId => {
    const result = await es[socket.userdata.organizationId].deleteByQuery({
      index: 'star',
      body: {
        query: {
          bool: {
            filter: [
              { term: { user_id: socket.userdata.id } },
              { term: { contact_user_id: targetContactUserId } },
            ],
          },
        },
      },
    });

    if (result.deleted === 1) {
      socket.emit('deleteStarContact', {
        data: targetContactUserId,
      });
    } else {
      socket.emit('deleteStarContact', {
        error: 'failed',
      });
    }
  });
}

async function searchClausesByArticle(io, socket) {
  socket.on('suggestion', async (input, index) => {
    const result = await suggestions(socket.userdata.organizationId, input, index);

    if (!index) socket.emit('suggestion', result);
    else socket.emit('clauses', result);
  });
}

async function searchClausesByContent(io, socket) {
  socket.on('matchedClauses', async input => {
    if (!input) return;
    const result = await matchedClauses(socket.userdata.organizationId, input);

    socket.emit('matchedClauses', result);
  });
}

async function updateClausesLastSearchTime(io, socket) {
  socket.on('updateMatchedClauses', async (origin, title, number) => {
    try {
      await es[socket.userdata.organizationId].updateByQuery({
        index: 'matchedclauses',
        script: {
          source: `ctx._source.last_searched = '${origin}'`,
          lang: 'painless',
        },
        query: {
          bool: {
            filter: [{ term: { title: title } }, { term: { number: number } }],
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  });
}

async function searchEamil(io, socket) {
  socket.on('searchEamil', async input => {
    console.log('current organizationId: ' + socket.userdata.organizationId);

    const {
      hits: { hits: result },
    } = await es[socket.userdata.organizationId].search({
      index: 'user',
      body: {
        size: 5,
        query: {
          prefix: { 'email.search_as_you_type': input },
        },
      },
    });

    const users = result.map(user => ({
      id: user._id,
      name: user._source.name,
      email: user._source.email,
      picture: user._source.picture,
    }));

    socket.emit('searchEamil', users);
  });
}

async function changeProfilePicture(io, socket) {
  socket.on('changeProfilePicture', async userId => {
    socket.broadcast.emit('changeProfilePicture', userId);
  });
}

async function changeFirmPicture(io, socket) {
  socket.on('changeFirmPicture', async firmId => {
    socket.to(firmId).emit('changeFirmPicture', firmId);
  });
}

module.exports = {
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
