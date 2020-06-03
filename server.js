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
    console.log('receiving files--------', req.files);
    let file = req.files.file;
    console.log('file name--------', file.name);
    file.mv('./temp/' + file.name);
    res.sendStatus(200);
  } catch (e) {
    console.log('error', e);
    res.status(500).json(e);
  }
});

app.get('/cleararray', function (req, res) {
  array = []
  res.redirect('/');
});

app.get('/file/:filename', async (req, res) => {
  try {
    console.log('returning file name---------->', req.params.filename);
    const file = await fs.readFileSync(path.join(`./temp/${req.params.filename}`));
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
  console.log(`Example app listening on port ${port}!`);
});
