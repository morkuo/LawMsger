const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { pubClient, subClient } = require('./utils/redis');
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

  const controllers = require('./socket/controllers')(io);

  io.on('connection', async socket => {
    const ctrs = Object.values(controllers);
    for (let ctr of ctrs) {
      ctr(socket);
    }
  });

  return io;
}

module.exports = connect;
