const http2 = require('spdy');
const path = require('path');
const logger = require('morgan');
const express = require('express');
const app = express();
const fs = require('fs');
const port = 8443;

app.use(logger('dev'));

const jpeg = {
  'content-type': 'image/jpeg'
};
const png = {
  'content-type': 'image/png'
};

const js = {
  'content-type': 'application/javascript'
};

const icon = {
  'content-type': 'image/x-icon'
};

const text = {'content-type': 'text/html'};

const ASSETS_DIR = __dirname + '/public/assets';
const PUBLIC_DIR = __dirname + '/public';
console.log(ASSETS_DIR);
let files = {};
const filesList = fs.readdirSync(ASSETS_DIR);
console.log(filesList);

filesList.forEach(item => {
  let content = {};
  const ext = path.extname(item).toLowerCase();
  if (ext === '.js') {
    content.type = js;
  } else if (ext === '.png') {
    content.type = png;
  } else if (ext === '.jpeg') {
    content.type = jpeg;
  } else if (ext === '.ico') {
    content.type = icon;
  } else {
    content.type = text;
  }
  content.data = fs.readFileSync(ASSETS_DIR + '/' + item);
  files[item] = content;
});

const indexHtmlHttp = fs.readFileSync(PUBLIC_DIR + '/indexHttp.html');
const indexHtml = fs.readFileSync(PUBLIC_DIR + '/index.html');

const getHeader = function(contentType) {
  return {
    status: 200,
    method: 'GET',
    request: {
      accept: '*/*'
    },
    response: contentType
  };
};

const pushStream = function(res, fileName) {
  let stream = res.push('/' + fileName, getHeader(files[fileName].type));
  stream.on('error', function(e) {
    console.log(e);
  });
  stream.end(files[fileName].data);
};

app.get('/', (req, res) => {
  if (req.isSpdy) {
    filesList.forEach(item => {
      pushStream(res, item);
    });
    res.writeHead(200, text);
    res.end(indexHtml);
  } else {
    res.writeHead(200, text);
    res.end(indexHtmlHttp);
  }
});

const options = {
  key: fs.readFileSync(__dirname + '/localhost.key'),
  cert: fs.readFileSync(__dirname + '/localhost.crt')
};


http2
  .createServer(options, app).listen(port, ()=>{
    console.log(`Server is listening on https://localhost:${port}.`)
  }
);