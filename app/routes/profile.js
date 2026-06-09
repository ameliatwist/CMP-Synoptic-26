const express = require('express');
const router = express.Router();
const jobs = () => global.jobs.data;

router.get('/', async (req, res) => {
    const result = await jobs().push({
        type: jobs().TYPE_GET_USER_PROFILE,
        user_id: req.session.user.id
    });

    if (result.err) {
        return res.redirect('/index');
    }

    const flashError = req.session.rewardError || null;
    delete req.session.rewardError;

    res.render('profile', {
        user: req.session.user,
        profile: result.result.user,
        reportStats: result.result.reportStats,
        flashError
    });
});

module.exports = router;
