// Route for handling user login, including form validation and interaction with the data layer to authenticate users and manage sessions
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('login');
});

router.post('/', async function (req, res) {
  const login = req.body.login?.trim();
  const password = req.body.password;

  if (!login || !password) {
    return res.status(400).json({ message: 'Please enter your username/email and password.' });
  }
// Interact with the data layer to authenticate the user and manage sessions, handling any errors that may occur
  try {
    const result = await global.jobs.data.push({
      type: global.jobs.data.TYPE_LOGIN_ANY,
      login,
      password
    });

    if (result.err) {
      return res.status(401).json({ message: result.err });
    }

    const { role, data } = result.result;

    if (role === 'council') {
      req.session.council = { id: data.id, username: data.username };
      return res.status(200).json({ message: 'Login successful.', redirect: '/council-dashboard' });
    } else {
      req.session.user = { id: data.id, username: data.username, fullname: data.fullname };
      return res.status(200).json({ message: 'Login successful.', redirect: '/index' });
    }

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
