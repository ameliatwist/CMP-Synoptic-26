const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  res.render('rewards');
});

module.exports = router;