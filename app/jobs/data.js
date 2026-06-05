const db = require("../db")
const bcrypt = require("bcrypt");
const Queue = require("better-queue");
saltRounds = 10

const Queue = require("better-queue");

const TYPE_LOGIN_USER = "LOGIN_USER";
const loginUser = async function (input) {
    if (input.login == null || input.password == null) {
        return { err: "incomplete input", result: null };
    }

    try {
        // database code goes here
        const result = await db.oneOrNone(
            `SELECT * FROM users WHERE username = $1 OR email = $1`,
            [input.login]
        );

        return { err: null, result: result };
    } catch (error) {
        return { err: String(error), result: null };
    }
}


const handlers = {
    [TYPE_LOGIN_USER]: loginUser
};


const queue = new Queue(async function (input, cb) {
    try {
        const handler = handlers[input.type];

        if (!handler) {
            return cb("unsupported input.type", null)
        }

        const { err, result } = await handler(input)

        cb(err, result)
    } catch (error) {
        cb(String(error), null)
    }
})



const push = (input) => {
    return new Promise((resolve, reject) => {
        queue.push(input, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};