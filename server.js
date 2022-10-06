const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/1.0', [
  require('./routes/user'),
  require('./routes/contact'),
  require('./routes/message'),
  require('./routes/group'),
  require('./routes/firm'),
]);

const httpServer = app.listen(3000, () => {
  console.log('Running!');
});
const io = require('./socket.js')(httpServer);

app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'server error' });

  console.log(err);
});
