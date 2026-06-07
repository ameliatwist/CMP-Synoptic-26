const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  res.render('login');
});


router.post("/", async function (req, res) {
  const login = req.body.login?.trim();
  const password = req.body.password;

  if (!login || !password) {
    return res.status(400).json({ message: "Please enter your username/email and password." });
  }

  try {
    // find by username or email
    const userResult = await global.jobs.data.push({
      type: global.jobs.data.TYPE_LOGIN_USER,
      login,
      password
    });

    if (userResult.err) {
      return res.status(401).json({ message: userResult.err });
    }

    const user = userResult.result;

    // active session data
    req.session.user = { 
      id: user.userId, 
      username: user.username,
      firstName: user.firstName
    };
    
    return res.status(200).json({ message: "Login successful." });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});


module.exports = router;