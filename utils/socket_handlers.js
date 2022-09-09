const es = require('./es');
const { jwtVerify } = require('../utils/helper');

function msgHandler(io, socket) {
  socket.on('msg', async (msg, targetSocketId, targetUserId, targetUserName, filesInfo) => {
    // console.log('Server receives: ' + msg);
    // console.log('received' + fileUrls);

    const fromSocketId = socket.id;
    socket.to(targetSocketId).emit('msg', msg, fromSocketId, filesInfo);

    const parsedFilesInfo = await JSON.parse(filesInfo);
    parsedFilesInfo.data.forEach(fileObj => {
      //S3 presigned url which is going to expires
      delete fileObj.location;
    });

    await es.index({
      index: 'message',
      document: {
        sender_id: socket.userdata.id,
        sender_name: socket.userdata.name,
        receiver_id: targetUserId,
        receiver_name: targetUserName,
        message: msg,
        files: JSON.stringify(parsedFilesInfo),
      },
    });

    // console.log('Msg has been sent to: ' + targetSocketId);
  });
}

async function idHandler(io, socket) {
  const { jwtToken } = socket.handshake.query;
  const user = await jwtVerify(jwtToken, process.env.JWT_SECRET);

  //partial update user socket_id
  const result = await es.update({
    index: 'user',
    id: user.id,
    doc: {
      socket_id: socket.id,
    },
  });

  socket.broadcast.emit('contactSocketIds', user.id, socket.id);

  socket.broadcast.emit('onlineStatus', socket.id, 'on');

  console.log('socket connected (user socket id updated): ' + socket.id);
}

async function disconnectionHandlers(io, socket) {
  socket.on('disconnect', async () => {
    const result = await es.update({
      index: 'user',
      id: socket.userdata.id,
      doc: {
        socket_id: null,
      },
    });

    socket.broadcast.emit('onlineStatus', socket.id, 'off');
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

module.exports = {
  msgHandler,
  idHandler,
  createStarContact,
  deleteStarContact,
  disconnectionHandlers,
};
