const { Server } = require('socket.io');
const { httpServer } = require('./server');
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
} = require('./utils/socket_handlers');
const { jwtVerify } = require('./utils/helper');

require('dotenv').config();

connect(httpServer);

async function connect(httpServer) {
  const io = new Server(httpServer, {
    cors: '*',
  });

  console.log('Socket Server is running');

  global.hashTable = {};

  io.use(async (socket, next) => {
    try {
      const { jwtToken } = socket.handshake.query;
      const user = await jwtVerify(jwtToken, process.env.JWT_SECRET);

      socket.userdata = user;
      next();
    } catch (err) {
      //pass to express error handler and emit connect_error event
      next(err);
    }
  });

  io.on('connection', async socket => {
    //handlers
    setOnlineStatus(socket);
    joinGroup(io, socket);
    joinFirm(io, socket);
    drawGroupDiv(io, socket);
    deleteGroupDiv(io, socket);
    msg(io, socket);
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
  });

  return io;
}

// module.exports = connect;
