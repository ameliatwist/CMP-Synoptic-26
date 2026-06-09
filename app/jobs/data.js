const db = require("../db");
const bcrypt = require("bcrypt");
const Queue = require("better-queue");

const saltRounds = 10;

// ── Auth ────────────────────────────────────────────────────

const TYPE_LOGIN_USER = "LOGIN_USER";
const loginUser = async function (input) {
    if (input.login == null || input.password == null) {
        return { err: "incomplete input", result: null };
    }
    try {
        const user = await db.oneOrNone(
            `SELECT * FROM users WHERE username = $1 OR email = $1`,
            [input.login]
        );
        if (!user) return { err: "User not found.", result: null };
        const match = await bcrypt.compare(input.password, user.password);
        if (!match) return { err: "Incorrect password.", result: null };
        return { err: null, result: user };
    } catch (error) {
        return { err: String(error), result: null };
    }
};

const TYPE_CREATE_USER = "CREATE_USER";
const createUser = async function (input) {
    if (!input.fullname || !input.username || !input.email || !input.password) {
        return { err: "incomplete input", result: null };
    }
    try {
        const existing = await db.oneOrNone(
            `SELECT * FROM users WHERE username = $1 OR email = $2`,
            [input.username, input.email]
        );
        if (existing) return { err: "Username or email already exists.", result: null };
        const hashed = await bcrypt.hash(input.password, saltRounds);
        const user = await db.one(
            `INSERT INTO users (fullname, username, email, password)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [input.fullname, input.username, input.email, hashed]
        );
        return { err: null, result: user };
    } catch (error) {
        return { err: String(error), result: null };
    }
};

const TYPE_LOGIN_COUNCIL = "LOGIN_COUNCIL";
const loginCouncil = async function (input) {
    if (input.login == null || input.password == null) {
        return { err: "incomplete input", result: null };
    }
    try {
        const staff = await db.oneOrNone(
            `SELECT * FROM council_staff WHERE username = $1 OR email = $1`,
            [input.login]
        );
        if (!staff) return { err: "Account not found.", result: null };
        const match = await bcrypt.compare(input.password, staff.password);
        if (!match) return { err: "Incorrect password.", result: null };
        return { err: null, result: staff };
    } catch (error) {
        return { err: String(error), result: null };
    }
};

// Checks users first, then council_staff — returns { role: 'user'|'council', data }
const TYPE_LOGIN_ANY = "LOGIN_ANY";
const loginAny = async function (input) {
    if (input.login == null || input.password == null) {
        return { err: "incomplete input", result: null };
    }
    try {
        const user = await db.oneOrNone(
            `SELECT * FROM users WHERE username = $1 OR email = $1`,
            [input.login]
        );
        if (user && await bcrypt.compare(input.password, user.password)) {
            return { err: null, result: { role: 'user', data: user } };
        }

        const staff = await db.oneOrNone(
            `SELECT * FROM council_staff WHERE username = $1 OR email = $1`,
            [input.login]
        );
        if (staff && await bcrypt.compare(input.password, staff.password)) {
            return { err: null, result: { role: 'council', data: staff } };
        }

        return { err: "Incorrect username/email or password.", result: null };
    } catch (error) {
        return { err: String(error), result: null };
    }
};

// ── Reports ─────────────────────────────────────────────────

const TYPE_SUBMIT_REPORT = "SUBMIT_REPORT";
const submitReport = async function (input) {
    if (!input.user_id || !input.location) {
        return { err: "Missing required fields.", result: null };
    }
    try {
        const report = await db.one(
            `INSERT INTO reports (user_id, description, location, bin_level, report_type, latitude, longitude)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                input.user_id,
                input.description || "",
                input.location,
                input.bin_level || null,
                input.report_type || "street",
                input.latitude || null,
                input.longitude || null
            ]
        );
        await db.none(
            `UPDATE users SET points = points + 10 WHERE id = $1`,
            [input.user_id]
        );
        return { err: null, result: report };
    } catch (error) {
        return { err: String(error), result: null };
    }
};

const TYPE_GET_REPORTS_FOR_USER = "GET_REPORTS_FOR_USER";
const getReportsForUser = async function (input) {
    try {
        const reports = await db.any(
            `SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
            [input.user_id]
        );
        return { err: null, result: reports };
    } catch (error) {
        return { err: String(error), result: null };
    }
};

const TYPE_GET_ALL_REPORTS = "GET_ALL_REPORTS";
const getAllReports = async function () {
    try {
        const reports = await db.any(
            `SELECT reports.*, users.username
             FROM reports
             JOIN users ON reports.user_id = users.id
             ORDER BY reports.created_at DESC`
        );
        return { err: null, result: reports };
    } catch (error) {
        return { err: String(error), result: null };
    }
};

const TYPE_UPDATE_REPORT_STATUS = "UPDATE_REPORT_STATUS";
const updateReportStatus = async function (input) {
    try {
        const report = await db.one(
            `UPDATE reports SET status = $1 WHERE id = $2 RETURNING *`,
            [input.status, input.report_id]
        );
        return { err: null, result: report };
    } catch (error) {
        return { err: String(error), result: null };
    }
};

const TYPE_GET_USER_PROFILE = "GET_USER_PROFILE";
const getUserProfile = async function (input) {
    try {
        const user = await db.one(
            `SELECT id, fullname, username, email, points, created_at FROM users WHERE id = $1`,
            [input.user_id]
        );
        const reportStats = await db.one(
            `SELECT
                COUNT(*)                                          AS total,
                COUNT(*) FILTER (WHERE status='approved')        AS approved,
                COUNT(*) FILTER (WHERE status='pending')         AS pending,
                COUNT(*) FILTER (WHERE status='collected')       AS collected,
                COUNT(*) FILTER (WHERE status='rejected')        AS rejected,
                COUNT(*) FILTER (WHERE report_type='household')  AS household,
                COUNT(*) FILTER (WHERE report_type='street')     AS street,
                COUNT(*) FILTER (WHERE report_type='missed_collection') AS missed
             FROM reports WHERE user_id = $1`,
            [input.user_id]
        );
        return { err: null, result: { user, reportStats } };
    } catch (error) {
        return { err: String(error), result: null };
    }
};

// ── Points & Rewards ────────────────────────────────────────

const TYPE_GET_USER_POINTS = "GET_USER_POINTS";
const getUserPoints = async function (input) {
    try {
        const row = await db.one(
            `SELECT points FROM users WHERE id = $1`,
            [input.user_id]
        );
        return { err: null, result: row.points };
    } catch (error) {
        return { err: String(error), result: null };
    }
};

const TYPE_REDEEM_POINTS = "REDEEM_POINTS";
const redeemPoints = async function (input) {
    try {
        const row = await db.one(`SELECT points FROM users WHERE id = $1`, [input.user_id]);
        if (row.points < input.points_cost) {
            return { err: "Not enough points.", result: null };
        }
        await db.one(
            `INSERT INTO reward_redemptions (user_id, reward_name, points_cost)
             VALUES ($1, $2, $3) RETURNING *`,
            [input.user_id, input.reward_name, input.points_cost]
        );
        await db.none(
            `UPDATE users SET points = points - $1 WHERE id = $2`,
            [input.points_cost, input.user_id]
        );
        return { err: null, result: true };
    } catch (error) {
        return { err: String(error), result: null };
    }
};

const TYPE_GET_ALL_USERS_POINTS = "GET_ALL_USERS_POINTS";
const getAllUsersPoints = async function () {
    try {
        const users = await db.any(
            `SELECT id, username, fullname, points FROM users ORDER BY points DESC`
        );
        return { err: null, result: users };
    } catch (error) {
        return { err: String(error), result: null };
    }
};

// ── Queue ───────────────────────────────────────────────────

const handlers = {
    [TYPE_GET_USER_PROFILE]: getUserProfile,
    [TYPE_LOGIN_USER]: loginUser,
    [TYPE_CREATE_USER]: createUser,
    [TYPE_LOGIN_COUNCIL]: loginCouncil,
    [TYPE_LOGIN_ANY]: loginAny,
    [TYPE_SUBMIT_REPORT]: submitReport,
    [TYPE_GET_REPORTS_FOR_USER]: getReportsForUser,
    [TYPE_GET_ALL_REPORTS]: getAllReports,
    [TYPE_UPDATE_REPORT_STATUS]: updateReportStatus,
    [TYPE_GET_USER_POINTS]: getUserPoints,
    [TYPE_REDEEM_POINTS]: redeemPoints,
    [TYPE_GET_ALL_USERS_POINTS]: getAllUsersPoints
};

const queue = new Queue(async function (input, cb) {
    try {
        const handler = handlers[input.type];
        if (!handler) return cb("unsupported input.type", null);
        const { err, result } = await handler(input);
        cb(err, result);
    } catch (error) {
        cb(String(error), null);
    }
});

const push = (input) => {
    return new Promise((resolve) => {
        queue.push(input, (err, result) => {
            resolve({ err: err || null, result: result !== undefined ? result : null });
        });
    });
};

module.exports = {
    push,
    TYPE_GET_USER_PROFILE,
    TYPE_LOGIN_USER,
    TYPE_CREATE_USER,
    TYPE_LOGIN_COUNCIL,
    TYPE_LOGIN_ANY,
    TYPE_SUBMIT_REPORT,
    TYPE_GET_REPORTS_FOR_USER,
    TYPE_GET_ALL_REPORTS,
    TYPE_UPDATE_REPORT_STATUS,
    TYPE_GET_USER_POINTS,
    TYPE_REDEEM_POINTS,
    TYPE_GET_ALL_USERS_POINTS
};
