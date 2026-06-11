// Route for the main dashboard page, showing user points and reports, and allowing users to submit new reports
const express = require('express');
const router = express.Router();
const jobs = () => global.jobs.data;

router.get('/', async (req, res) => {
    const user = req.session.user;

    const [pointsResult, reportsResult] = await Promise.all([
        jobs().push({ type: jobs().TYPE_GET_USER_POINTS, user_id: user.id }),
        jobs().push({ type: jobs().TYPE_GET_REPORTS_FOR_USER, user_id: user.id })
    ]);

    res.render('index', {
        user,
        points: pointsResult.result || 0,
        reports: reportsResult.result || []
    });
});
// Handles the form submission for creating a new report, including validation and interaction with the data layer
router.post('/', async (req, res) => {
    const user = req.session.user;
    const { description, location, bin_level, report_type, latitude, longitude } = req.body;

    if (!location || !location.trim()) {
        return res.status(400).json({ message: 'Please enter a location.' });
    }

    const result = await jobs().push({
        type: jobs().TYPE_SUBMIT_REPORT,
        user_id: user.id,
        description: description || '',
        location: location.trim(),
        bin_level: bin_level || null,
        report_type: report_type || 'street',
        latitude: latitude || null,
        longitude: longitude || null
    });

    if (result.err) {
        return res.status(500).json({ message: result.err });
    }

    return res.status(201).json({ message: 'Report submitted! +10 points.' });
});

module.exports = router;
