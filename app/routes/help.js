// Route for the help page, providing users with information on how to use the application and contact support if needed
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('help');
});

module.exports = router;
