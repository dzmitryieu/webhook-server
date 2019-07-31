const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

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
  const match = signature === req.headers['x-elateral-signature'];
  array.push({
    headers: req.headers,
    body: req.body,
    match,
  });
  res = res.status(match ? 200 : 403);
  res.send(req.body);
});

app.get('/', function (req, res) {
  res.json(array.slice());
});



app.listen(7000, function () {
  console.log('Example app listening on port 7000!');
});
