const compression = require('compression');
const cors = require('cors');
const express = require('express');
const path = require('path');

const SSE = require('express-sse');

const { spawn } = require("child_process");

const sse = new SSE();

const server = express();
server.use(cors());
server.use(compression());

server.use(express.json({ limit: '50mb' }));
server.use(express.urlencoded({ extended: true }))

const PORT = 8080;
const HOST = 'localhost';
const BASE_HREF = '/';

server.get('', function (req, res) {
  res.sendFile(path.join(__dirname + '/public/index.html'));
});

server.post('/run', function (req, res) {

  console.log(req.body);

  const process = spawn(req.body.command, req.body.args, {
    shell: true
  });

  process.stdout.on('data', data => {
    sse.send(data, req.body.event);
  });

  process.stderr.on('data', data => {
    sse.send(data, req.body.event);
  });

  process.on('error', (error) => {
    console.log(`error: ${error.message}`);
  });

  process.on('close', code => {
    console.log(`child process exited with code ${code}`);
  });

});

server.get('/event', sse.init);

server.use(express.static('public'));

server.listen(PORT, HOST, () => {
  console.log(`listening on http://${HOST}:${PORT}${BASE_HREF}`);
});
