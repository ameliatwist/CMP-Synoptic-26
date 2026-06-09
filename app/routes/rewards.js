const express = require('express');
const router = express.Router();
const jobs = () => global.jobs.data;

router.get('/', (req, res) => res.redirect('/profile'));

router.post('/', async (req, res) => {
    const user = req.session.user;
    const { reward_name, points_cost } = req.body;

    const result = await jobs().push({
        type: jobs().TYPE_REDEEM_POINTS,
        user_id: user.id,
        reward_name,
        points_cost: parseInt(points_cost, 10)
    });

    if (result.err) {
        req.session.rewardError = result.err;
    }

    res.redirect('/profile');
});

module.exports = router;
