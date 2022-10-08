const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { pubClient, subClient } = require('./utils/redis');
const {
  setOnlineStatus,
  joinGroup,
  joinFirm,
  drawGroupDiv,
  deleteGroupDiv,
  msg,
  groupMsg,
  searchClausesByArticle,
  searchClausesByContent,
  updateClausesLastSearchTime,
  checkChatWindow,
  checkGroupChatWindow,
  createStarContact,
  deleteStarContact,
  searchEamil,
  changeProfilePicture,
  changeFirmPicture,
  disconnection,
} = require('./socket/controllers');
const { jwtVerify, socketTryCatch: tryCatch } = require('./utils/helper');
require('dotenv').config();

async function connect(httpServer) {
  const io = new Server(httpServer, {
    cors: '*',
  });

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
      setOnlineStatus(io, socket);
      msg(io, socket);
      joinGroup(io, socket);
      joinFirm(io, socket);
      drawGroupDiv(io, socket);
      deleteGroupDiv(io, socket);
      groupMsg(io, socket);
      searchClausesByArticle(io, socket);
      searchClausesByContent(io, socket);
      updateClausesLastSearchTime(io, socket);
      checkChatWindow(io, socket);
      checkGroupChatWindow(io, socket);
      createStarContact(io, socket);
      deleteStarContact(io, socket);
      searchEamil(io, socket);
      changeProfilePicture(io, socket);
      changeFirmPicture(io, socket);
      disconnection(io, socket);
    })
  );

  return io;
}

module.exports = connect;
