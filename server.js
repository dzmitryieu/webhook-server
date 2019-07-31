const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
var https = require('https')

const array = [];
const secret = 'secret';

const app = express();
app.use(bodyParser.text({
  type: function(req) {
    return 'text';
  }
}));

app.post('/post', function (req, res) {
  const signature = crypto.createHmac('sha1', secret).update(req.body).digest('hex');
  let match = false;
  const sign = req.headers['x-elateral-signature'];
  const hash = sign ? sign.match(/sha1=([a-zA-Z0-9]+)/)[1] : null;
  if (hash === signature || hash === null) {
    match = true;
  }
  array.push({
    headers: req.headers,
    body: req.body,
    match,
  });
  if (!match) {
    res.sendStatus(403);
  } else {
    res.sendStatus(200);
  }
});

app.get('/', function (req, res) {
  res.json(array.slice());
});

app.listen(process.env.PORT || 7000, function () {
  console.log('Example app listening on port 7000!');
});
