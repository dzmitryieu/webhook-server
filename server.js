const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

let array = [];
let arrayForRretry = [];
let trycount = 0;

const app = express();
app.use(bodyParser.text({
  type: function(req) {
    return 'text';
  }
}));

app.post('/post', function (req, res) {
  const signature = req.query.secret ? crypto.createHmac('sha1', req.query.secret).update(req.body).digest('hex') : null;
  let match = false;
  let hash;
  const sign = req.headers['x-elateral-signature'];
  if (sign && sign.match(/sha1=([a-zA-Z0-9]+)/) && sign.match(/sha1=([a-zA-Z0-9]+)/)[1]) {
    hash = sign.match(/sha1=([a-zA-Z0-9]+)/)[1];
  } else if (!sign) {
    hash = null;
  }
  if (hash === signature || hash === null) {
    match = true;
  }
  array.push({
    headers: req.headers,
    body: JSON.parse(req.body),
    match,
    date: new Date(),
  });
  if (!match) {
    res.sendStatus(403);
  } else {
    res.sendStatus(200);
  }
});

app.post('/post/turn', function (req, res) {
  const signature = req.query.secret ? crypto.createHmac('sha1', req.query.secret).update(req.body).digest('hex') : null;
  let match = false;
  let hash;
  const sign = req.headers['x-elateral-signature'];
  if (sign && sign.match(/sha1=([a-zA-Z0-9]+)/) && sign.match(/sha1=([a-zA-Z0-9]+)/)[1]) {
    hash = sign.match(/sha1=([a-zA-Z0-9]+)/)[1];
  } else if (!sign) {
    hash = null;
  }
  if (hash === signature || hash === null) {
    match = true;
  }
  arrayForRretry.push({
    headers: req.headers,
    body: JSON.parse(req.body),
    match,
    date: new Date(),
  });
  if (!match && (++trycount < 3)) {
    res.sendStatus(403);
  } else {
    res.sendStatus(200);
  }
});

app.get('/cleararray', function (req, res) {
  array = []
  res.json(array.slice());
});

app.get('/cleararrayturn', function (req, res) {
  arrayForRretry = []
  res.json(arrayForRretry.slice());
});

app.get('/', function (req, res) {
  res.json(array.slice());
});

app.get('/', function (req, res) {
  res.json(arrayForRretry.slice());
})

app.listen(process.env.PORT || 7000, function () {
  console.log('Example app listening on port 7000!');
});
