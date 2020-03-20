const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

let array = [];

const app = express();
app.use(bodyParser.text({
  type: function(req) {
    return 'text';
  }
}));

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

app.get('/cleararray', function (req, res) {
  array = []
  res.redirect('/');
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

let a = new Error();
console.log(a.path)

const port = process.env.PORT || 7000;
app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});