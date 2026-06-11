// Route for updating the status of a report from the council dashboard
const express = require('express');
const router = express.Router();
const jobs = () => global.jobs.data;

router.post('/update', async (req, res) => {
    const { report_id, status } = req.body;

    if (!report_id || !['approved', 'rejected', 'pending', 'collected'].includes(status)) {
        return res.redirect('/council-dashboard');
    }

    await jobs().push({
        type: jobs().TYPE_UPDATE_REPORT_STATUS,
        report_id: parseInt(report_id, 10),
        status
    });

    res.redirect('/council-dashboard');
});

module.exports = router;
