const express = require('express');
const router = express.Router();
const jobs = () => global.jobs.data;

router.get('/', async (req, res) => {
    const result = await jobs().push({ type: jobs().TYPE_GET_ALL_REPORTS });
    const reports = result.result || [];

    // Count reports per location and sort by count descending
    const counts = {};
    for (const r of reports) {
        counts[r.location] = (counts[r.location] || 0) + 1;
    }
    const areaSummary = Object.entries(counts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count);

    res.render('council-routes', {
        council: req.session.council,
        areaSummary
    });
});

module.exports = router;
