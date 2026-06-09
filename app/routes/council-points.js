const express = require('express');
const router = express.Router();
const jobs = () => global.jobs.data;

router.get('/', async (req, res) => {
    const result = await jobs().push({ type: jobs().TYPE_GET_ALL_USERS_POINTS });

    res.render('council-points', {
        council: req.session.council,
        users: result.result || []
    });
});

module.exports = router;
