const { Server } = require('socket.io');
const {
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
} = require('./utils/socket_handlers');
const es = require('./utils/es');
const { jwtVerify } = require('./utils/helper');

require('dotenv').config();

async function connect(server) {
  const io = new Server(server);

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
    idHandler(io, socket);
    joinGroupHandler(io, socket);
    msgHandler(io, socket);
    suggestionsHandler(io, socket);
    matchedClausesHandler(io, socket);
    updateMatchedClausesHandler(io, socket);
    checkChatWindowHandler(io, socket);
    createStarContact(io, socket);
    deleteStarContact(io, socket);
    disconnectionHandlers(io, socket);
  });

  return io;
}

module.exports = connect;
