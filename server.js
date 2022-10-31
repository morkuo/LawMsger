const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.get('/health', (req, res) => res.end());

app.use(
  cors({
    origin: process.env.EXPRESS_CORS_ORIGIN,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/1.0', [
  require('./routes/user'),
  require('./routes/contact'),
  require('./routes/message'),
  require('./routes/group'),
  require('./routes/firm'),
]);

const PORT = 3000;

const httpServer = app.listen(PORT, () => {
  console.log('Running!');
});
require('./socket.js')(httpServer);

app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'server error' });

  console.log(err);
});
