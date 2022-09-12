const es = require('./es');
const { jwtVerify } = require('../utils/helper');
const { suggestions, matchedClauses } = require('../models/message');

function msgHandler(io, socket) {
  socket.on('msg', async (msg, targetSocketId, targetUserId, targetUserName, filesInfo) => {
    // console.log('Server receives: ' + msg);
    // console.log('received' + fileUrls);

    const fromSocketId = socket.id;
    const fromUserId = socket.userdata.id;
    const fromUserName = socket.userdata.name;

    if (!io.sockets.adapter.rooms.has(targetSocketId)) {
      const parsedFilesInfo = await JSON.parse(filesInfo);
      parsedFilesInfo.data.forEach(fileObj => {
        //S3 presigned url which is going to expires
        delete fileObj.location;
      });
      await es.index({
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

    // console.log('Msg has been sent to: ' + targetSocketId);
  });
}

async function checkChatWindowHandler(io, socket) {
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

      await es.index({
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

async function idHandler(io, socket) {
  socket.broadcast.emit('onlineStatus', socket.userdata.id, socket.id, 'on');

  global.hashTable[socket.userdata.id] = socket.id;

  //partial update user socket_id
  const result = await es.update({
    index: 'user',
    id: socket.userdata.id,
    doc: {
      socket_id: socket.id,
    },
  });

  // console.log('new socket connected: ' + socket.id);
  console.log('new connection. all connected sockets: ', io.allSockets());
}

async function joinGroupHandler(io, socket) {
  socket.on('join', async groups => {
    const groupIds = groups.map(group => group.id);

    socket.join(groupIds);

    console.log(`${socket.id} is in following rooms: `, socket.rooms);

    // delete global.hashTable[socket.userdata.id];

    // console.log('user disconnected: ' + socket.id);
  });

  // socket.broadcast.emit('onlineStatus', socket.userdata.id, socket.id, 'on');

  // global.hashTable[socket.userdata.id] = socket.id;

  //partial update user socket_id
  // const result = await es.update({
  //   index: 'user',
  //   id: socket.userdata.id,
  //   doc: {
  //     socket_id: socket.id,
  //   },
  // });
}

async function disconnectionHandlers(io, socket) {
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
    } = await es.search({
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

    const result = await es.index({
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
    const result = await es.deleteByQuery({
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

async function suggestionsHandler(io, socket) {
  socket.on('suggestion', async (input, index) => {
    const result = await suggestions(input, index);

    if (!index) socket.emit('suggestion', result);
    else socket.emit('clauses', result);
  });
}

async function matchedClausesHandler(io, socket) {
  socket.on('matchedClauses', async input => {
    if (!input) return;
    const result = await matchedClauses(input);

    socket.emit('matchedClauses', result);
  });
}

async function updateMatchedClausesHandler(io, socket) {
  socket.on('updateMatchedClauses', async (origin, title, number) => {
    await es.updateByQuery({
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
  });
}

module.exports = {
  idHandler,
  joinGroupHandler,
  msgHandler,
  suggestionsHandler,
  matchedClausesHandler,
  updateMatchedClausesHandler,
  checkChatWindowHandler,
  createStarContact,
  deleteStarContact,
  disconnectionHandlers,
};
