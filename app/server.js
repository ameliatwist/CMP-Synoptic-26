const express = require('express');
const app = express();
const path = require('path');

var session = require('express-session');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use('/static', express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: 'wise elephant',
    resave: false,
    saveUninitialized: true,
    cookie: function (req) {
      var match = req.url.match(/^\/([^/]+)/);
      return {
        path: match ? '/' + match[1] : '/',
        httpOnly: true,
        secure: req.secure || false,
        maxAge: 1000 * 60 * 60 * 24 * 7
      };
    },
  })
);

app.get("/", (req, res) => {
    res.send("response")
})



app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
