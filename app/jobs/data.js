const db = require("../db");
const bcrypt = require("bcrypt");
const Queue = require("better-queue");

const saltRounds = 10;


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
        
        if (!user) {
            return { err: "User not found.", result: null };
        }
        
        const passwordMatch = await bcrypt.compare(input.password, user.password);
        
        if (!passwordMatch) {
            return { err: "Incorrect password.", result: null };
        }
        
        return { err: null, result: user };
        
    } catch (error) {
        return { err: String(error), result: null };
    }
};

const TYPE_CREATE_USER = "CREATE_USER";
const createUser = async function (input) {
  if (
    input.fullname == null ||
    input.username == null ||
    input.email == null ||
    input.password == null
  ) {
    return { err: "incomplete input", result: null };
  }

  try {
    const existingUser = await db.oneOrNone(
      `SELECT * FROM users WHERE username = $1 OR email = $2`,
      [input.username, input.email]
    );

    if (existingUser) {
      return { err: "Username or email already exists.", result: null };
    }

    const hashedPassword = await bcrypt.hash(input.password, saltRounds);

    const newUser = await db.one(
      `
      INSERT INTO users (fullname, username, email, password)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [input.fullname, input.username, input.email, hashedPassword]
    );

    return { err: null, result: newUser };

  } catch (error) {
    return { err: String(error), result: null };
  }
};

const handlers = {
  [TYPE_LOGIN_USER]: loginUser,
  [TYPE_CREATE_USER]: createUser
};

const queue = new Queue(async function (input, cb) {
  try {
    const handler = handlers[input.type];

    if (!handler) {
      return cb("unsupported input.type", null);
    }

    const { err, result } = await handler(input);

    cb(err, result);

  } catch (error) {
    cb(String(error), null);
  }
});

const push = (input) => {
  return new Promise((resolve, reject) => {
    queue.push(input, (err, result) => {
      if (err) {
        resolve({ err: err, result: null });
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = {
  push,
  TYPE_LOGIN_USER,
  TYPE_CREATE_USER
};