const compression = require('compression');
const cors = require('cors');
const express = require('express');
const fs = require('fs');
const path = require('path');
const spdy = require('spdy');

const SSE = require('express-sse');

const CERTS_ROOT = './certs';

const config = {
  cert: fs.readFileSync(path.resolve(CERTS_ROOT, 'cert.pem')),
  key: fs.readFileSync(path.resolve(CERTS_ROOT, 'key.pem')),
};

const GLYPH_ROOT = './node_modules/bootstrap-icons/icons';

const glyphIcons = fs.readdirSync(GLYPH_ROOT);

const sse = new SSE();

const app = express();
app.use(cors());
app.use(compression());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }))

app.get('', function (req, res) {
  res.sendFile(path.join(__dirname + '/public/index.html'));
});

const grid = {
  columns: 32,
  rows: 32,
  size: 16
};

console.log(grid);

const glyphCache = {};

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomGlyph = () => {
  const glyphFileName = glyphIcons[getRandomInt(0, glyphIcons.length - 1)];

  return path.resolve(GLYPH_ROOT, glyphFileName);
};

const sendRandomGlyph = (id) => {
  const glyph = getRandomGlyph();
  if (glyphCache[glyph]) {
    sse.send(glyphCache[glyph], id);
  } else {
    fs.readFile(glyph, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      glyphCache[glyph] = data;
      sse.send(data, id);
    });
  }
}

app.get('/event', (req, res) => {
  sse.init(req, res);

  sse.send(grid, 'init');

  for (let x = 0; x < grid.columns; ++x) {
    for (let y = 0; y < grid.rows; ++y) {
      const id = `${x},${y}`;
      const interval = getRandomInt(2, 15) * 1000;
      sendRandomGlyph(id);
      setInterval(() => {
        sendRandomGlyph(id);
      }, interval);
    }
  }
});

app.use(express.static('public'));

spdy.createServer(config, app).listen(8443, (err) => {
  if (err) {
    console.error(err);

    return;
  }

  console.log('listening on https://localhost:8443')
});
