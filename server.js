const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Busboy = require('busboy');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const morgan = require('morgan');

let array = [];
let isLive = false;

const app = express();
// app.use(bodyParser.text({
//   type: function(req) {
//     return 'text';
//   }
// }));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

app.post('/post', function (req, res) {
  const secretOnServerSide = req.query.secret;
  let match;
  let matchReasone = 'missmatched'
  if(secretOnServerSide) {
    const signature = crypto.createHmac('sha1', secretOnServerSide).update(req.body).digest('hex');
    let hash;
    const sign = req.headers['x-elateral-signature'];
    if (sign && sign.match(/sha1=([a-zA-Z0-9]+)/) && sign.match(/sha1=([a-zA-Z0-9]+)/)[1]) {
      hash = sign.match(/sha1=([a-zA-Z0-9]+)/)[1];
    } else if (!sign) {
      hash = null;
    }
    if (hash === signature) {
      match = true;
      matchReasone = `Hash from x-elateral-signature is equal to created hash using secret on acceptors side: ${secretOnServerSide}`
    }
    if (hash === null) {
      match = false;
      matchReasone = `No x-elateral-signature provided but expected, secret on acceptors side: ${secretOnServerSide}`
    }
  } else{
    match = true;
    matchReasone = 'No x-elateral-signature expected - acceptor have no secret'
  }

  array.push({
    headers: req.headers,
    body: JSON.parse(req.body),
    match,
    matchReasone,
    secretOnServerSide,
    date: new Date(),
  });
  if (!match) {
    res.sendStatus(403);
  } else {
    res.sendStatus(200);
  }
});


app.use(fileUpload({
  createParentPath: true
}));

app.put('/put', async (req, res) => {
  try {
    console.log('headers------------', req.headers);
    console.log('receiving files--------');
    const data = {
      data: req.files.file.data,
      size: req.files.file.size,
      mimetype: req.files.file.mimetype,
      filename: req.body.filename,
    }
    console.log('file:', data);
    const { file } = req.files;
    const dir = path.join(__dirname, './temp');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    file.mv(path.join(__dirname, `./temp/${req.body.filename}`));
    res.sendStatus(200);
  } catch (e) {
    console.log('error', e);
    res.status(500).json(e);
  }
});

app.put('/put2', async (req, res) => {
  try {
    console.log('headers------------', req.headers);
    console.log('receiving files--------');
    const filename = req.headers['file-name'] || 'a_file';
    const dir = path.join(__dirname, './temp');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    const filePath = path.join(__dirname, `./temp/${filename}`);
    const fd = fs.openSync(filePath, 'w');
    fs.writeSync(fd, req.body, 0, req.body.length, null);
    fs.closeSync(fd);
    res.sendStatus(200);
  } catch (e) {
    console.log('error-----------------', e);
    res.status(500).json(e);
  }
});

app.put('/fail', async (req, res) => {
  try {
    console.log('headers------------', req.headers);
    console.log('returning 500 error------');
    res.sendStatus(500);
  } catch (e) {
    console.log('error', e);
    res.status(500).json(e);
  }
});

app.get('/cleararray', function (req, res) {
  array = []
  res.redirect('/');
});


app.get('/_status', (req, res) => {
  try {
    console.log('status----------');
    if (isLive) {
      console.log('status---isLive---');
      res.sendStatus(200);
    } else {
      console.log('status---NotLive--');
      res.sendStatus(500);
    }
  } catch (e) {
    console.log(e);
    res.status(500).json(e);
  }
});

app.get('/files/:filename', async (req, res) => {
  try {
    console.log('returning file name---------->', req.params.filename);
    const file = await fs.readFileSync(path.join(__dirname, `./temp/${req.params.filename}`));
    res.send(file);
  } catch (e) {
    res.status(500).json(e);
  }
});

app.get('/file/test-image/:filename', async (req, res) => {
  try {
    console.log('returning file name---------->', req.params.filename);
    const file = await fs.readFileSync(path.join(`./test-image/${req.params.filename}.pdf`));
    res.send(file);
  } catch (e) {
    res.status(500).json(e);
  }
});

app.get('/', function (req, res) {
  res.json({
    routes: [
      '/post',
      '/cleararray',
    ],
    reports: array.slice()
  });
});

const port = process.env.PORT || 7000;
app.listen(port, function () {
  isLive = true;
  console.log(`Example app listening on port ${port}!`);
});
