const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('./socket.js')(server);
app.io = io;

const cors = require('cors');

app.use(cors());

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/api/1.0', [
  require('./routes/user'),
  require('./routes/contact'),
  require('./routes/message'),
]);

server.listen(3000, () => {
  console.log('Running!');
});

app.use((err, req, res, next) => {
  console.log(err);
});