const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { pubClient, subClient } = require('./utils/redis');
const controllers = require('./socket/controllers');
const { jwtVerify, socketTryCatch: tryCatch } = require('./utils/helper');
require('dotenv').config();

async function connect(httpServer) {
  const io = new Server(httpServer, {
    cors: '*',
  });

  const controller = controllers(io);

  io.adapter(createAdapter(pubClient, subClient));

  console.log('Socket Server is running');

  io.use(
    tryCatch(async (socket, next) => {
      const { jwtToken } = socket.handshake.query;
      const user = await jwtVerify(jwtToken, process.env.JWT_SECRET);

      socket.userdata = user;
      next();
    })
  );

  io.on(
    'connection',
    tryCatch(async socket => {
      //handlers
      controller.setOnlineStatus(socket);
      controller.msg(socket);
      controller.joinGroup(socket);
      controller.joinFirm(socket);
      controller.drawGroupDiv(socket);
      controller.deleteGroupDiv(socket);
      controller.groupMsg(socket);
      controller.searchClausesByArticle(socket);
      controller.searchClausesByContent(socket);
      controller.updateClausesLastSearchTime(socket);
      controller.checkChatWindow(socket);
      controller.checkGroupChatWindow(socket);
      controller.createStarContact(socket);
      controller.deleteStarContact(socket);
      controller.searchEamil(socket);
      controller.changeProfilePicture(socket);
      controller.changeFirmPicture(socket);
      controller.disconnection(socket);
    })
  );

  return io;
}

module.exports = connect;
