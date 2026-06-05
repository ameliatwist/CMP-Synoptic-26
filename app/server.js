const express = require('express');
const app = express();
const path = require('path');

var session = require('express-session');
const { glob } = require('fs');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use('/static', express.static(path.join(__dirname, 'public')));


//db jobs or use global.jobs
// dbJobs = require("./jobs/data")

global.jobs = {
  data: require("./jobs/data")
}


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
        // cookie expires after 7 days
        maxAge: 1000 * 60 * 60 * 24 * 7
      };
    },
  })
);

app.get("/", (req, res) => {
    res.send("response")
})

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

app.use("/council-dashboard", require("./routes/council-dashboard"))
app.use("/council-login", require("./routes/council-login"))
app.use("/council-routes", require("./routes/council-routes"))
app.use("/create", require("./routes/create"))
app.use("/index", require("./routes/index"))
app.use("/login", require("./routes/login"))
app.use("/rewards", require("./routes/rewards"))

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
