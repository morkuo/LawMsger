const { Server } = require('socket.io');
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

  console.log('Socket Server is running');

  global.hashTable = {};

  io.use(
    tryCatch(async (socket, next) => {
      const { jwtToken } = socket.handshake.query;
      const user = await jwtVerify(jwtToken, process.env.JWT_SECRET);

      socket.userdata = user;
      next();
    })
  );

  io.on('connection', async socket => {
    //handlers
    setOnlineStatus(socket);
    msg(io, socket);
    joinGroup(socket);
    joinFirm(socket);
    drawGroupDiv(socket);
    deleteGroupDiv(socket);
    groupMsg(socket);
    searchClausesByArticle(socket);
    searchClausesByContent(socket);
    updateClausesLastSearchTime(socket);
    checkChatWindow(socket);
    checkGroupChatWindow(socket);
    createStarContact(socket);
    deleteStarContact(socket);
    searchEamil(socket);
    changeProfilePicture(socket);
    changeFirmPicture(socket);
    disconnection(socket);
  });

  return io;
}

module.exports = connect;
