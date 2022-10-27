const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { pubClient, subClient } = require('./utils/redis');
const { jwtVerify, socketTryCatch: tryCatch } = require('./utils/helper');
const controllers = require('./socket/controllers');
require('dotenv').config();

async function connect(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN,
    },
  });

  const ctr = controllers(io);

  io.adapter(createAdapter(pubClient, subClient));

  console.log('Socket Server is running');

  io.use(async (socket, next) => {
    try {
      const { jwtToken } = socket.handshake.query;
      const user = await jwtVerify(jwtToken, process.env.JWT_SECRET);

      socket.userdata = user;
      next();
    } catch (error) {
      console.log(error);
      next(error);
    }
  });

  io.on('connection', async socket => {
    ctr.setOnlineStatus(socket);
    ctr.msg(socket);
    ctr.joinGroup(socket);
    ctr.joinFirm(socket);
    ctr.drawGroupDiv(socket);
    ctr.deleteGroupDiv(socket);
    ctr.groupMsg(socket);
    ctr.searchClausesByArticle(socket);
    ctr.searchClausesByContent(socket);
    ctr.updateClausesLastSearchTime(socket);
    ctr.checkChatWindow(socket);
    ctr.checkGroupChatWindow(socket);
    ctr.createStarContact(socket);
    ctr.deleteStarContact(socket);
    ctr.searchEamil(socket);
    ctr.changeProfilePicture(socket);
    ctr.changeFirmPicture(socket);
    ctr.disconnection(socket);
  });

  return io;
}

module.exports = connect;
