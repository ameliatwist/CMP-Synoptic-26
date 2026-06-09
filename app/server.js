const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use('/static', express.static(path.join(__dirname, 'public')));

global.jobs = {
  data: require("./jobs/data")
};

app.use(session({
  secret: process.env.SESSION_SECRET || 'ecowaste-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

function requireCouncil(req, res, next) {
  if (!req.session.council) return res.redirect("/council-login");
  next();
}

app.get("/", (req, res) => res.redirect("/login"));
app.get("/council-login", (req, res) => res.redirect("/login"));

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

app.use("/login", require("./routes/login"));
app.use("/create", require("./routes/create"));

app.use("/index", requireLogin, require("./routes/index"));
app.use("/rewards", requireLogin, require("./routes/rewards"));
app.use("/profile", requireLogin, require("./routes/profile"));
app.use("/help", requireLogin, require("./routes/help"));
app.use("/council-dashboard", requireCouncil, require("./routes/council-dashboard"));
app.use("/council-routes", requireCouncil, require("./routes/council-routes"));
app.use("/council-reports", requireCouncil, require("./routes/council-reports"));
app.use("/council-points", requireCouncil, require("./routes/council-points"));

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
