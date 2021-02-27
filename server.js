const compression = require('compression');
const cors = require('cors');
const express = require('express');
const fs = require('fs');
const path = require('path');
const spdy = require('spdy');

const SSE = require('express-sse');

const { spawn } = require("child_process");

const CERTS_ROOT = './certs';

const config = {
  cert: fs.readFileSync(path.resolve(CERTS_ROOT, 'cert.pem')),
  key: fs.readFileSync(path.resolve(CERTS_ROOT, 'key.pem')),
};

const sse = new SSE();

const app = express();
app.use(cors());
app.use(compression());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }))

// serve index file
app.get('', function (req, res) {
  res.sendFile(path.join(__dirname + '/public/index.html'));
});

// request to connect client to server side event stream
app.get('/event', sse.init);

// handle request to run command, experimental
app.post('/run', function (req, res) {

  console.log(`event: ${req.body.event}`);
  console.log(`command: ${req.body.command}`);
  if(req.body.args) console.log(`args: ${req.body.args}`);

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
    if (code) {
      console.log(`child process exited with code ${code}`);
    }
  });

  res.end();
});

app.use(express.static('public'));

spdy.createServer(config, app).listen(8443, (err) => {
  if (err) {
      console.error('An error occured', error);
      return;
  }

  console.log('Server listening on https://localhost:8443.')
});
