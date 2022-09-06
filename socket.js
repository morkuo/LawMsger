const { Server } = require('socket.io');
const {
  msgHandler,
  idHandler,
  createStarContact,
  deleteStarContact,
  disconnectionHandlers,
} = require('./utils/socket_handlers');
const { jwtVerify } = require('./utils/helper');

require('dotenv').config();

function connect(server) {
  const io = new Server(server);

  io.use(async (socket, next) => {
    const { jwtToken } = socket.handshake.query;
    const user = await jwtVerify(jwtToken, process.env.JWT_SECRET);

    socket.userdata = user;
    next();
  });

  io.on('connection', async socket => {
    //handlers
    idHandler(io, socket);
    msgHandler(io, socket);
    createStarContact(io, socket);
    deleteStarContact(io, socket);
    disconnectionHandlers(io, socket);
  });

  return io;
}

module.exports = connect;
