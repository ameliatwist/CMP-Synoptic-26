const express = require('express');
const router = express.Router();
const jobs = () => global.jobs.data;

router.get('/', async (req, res) => {
    const result = await jobs().push({ type: jobs().TYPE_GET_ALL_REPORTS });
    const reports = result.result || [];

    const stats = {
        total: reports.length,
        approved:  reports.filter(r => r.status === 'approved').length,
        pending:   reports.filter(r => r.status === 'pending').length,
        collected: reports.filter(r => r.status === 'collected').length,
        rejected:  reports.filter(r => r.status === 'rejected').length
    };

    res.render('council-dashboard', {
        council: req.session.council,
        reports: reports.slice(0, 10),
        stats,
        reportsJson: JSON.stringify(reports)
    });
});

module.exports = router;
