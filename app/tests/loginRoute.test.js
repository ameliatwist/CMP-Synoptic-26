// Test suite for the login route, verifying that the route correctly validates input, interacts with the data layer to authenticate users, sets session variables, and returns appropriate responses for different scenarios (e.g. successful login, incorrect credentials, server errors)
const express = require("express");
const session = require("express-session");
const request = require("supertest");

global.jobs = {
    data: {
        TYPE_LOGIN_ANY: "LOGIN_ANY",
        push: jest.fn()
    }
};

const loginRoute = require("../routes/login");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: "test-secret",
    resave: false,
    saveUninitialized: true
}));

app.use("/login", loginRoute);

beforeEach(() => {
    jest.clearAllMocks();
});

test("POST /login returns 400 when login is missing", async () => {
    const response = await request(app)
        .post("/login")
        .send({
            password: "password123"
        });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Please enter your username/email and password.");
});

test("POST /login returns 400 when password is missing", async () => {
    const response = await request(app)
        .post("/login")
        .send({
            login: "sina"
        });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Please enter your username/email and password.");
});

test("POST /login returns 401 when login details are wrong", async () => {
    global.jobs.data.push.mockResolvedValue({
        err: "Incorrect username/email or password.",
        result: null
    });

    const response = await request(app)
        .post("/login")
        .send({
            login: "sina",
            password: "wrongpassword"
        });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Incorrect username/email or password.");
});

test("POST /login logs in a normal user and redirects to index", async () => {
    global.jobs.data.push.mockResolvedValue({
        err: null,
        result: {
            role: "user",
            data: {
                id: 1,
                username: "sina",
                fullname: "Sina Taeid"
            }
        }
    });

    const response = await request(app)
        .post("/login")
        .send({
            login: "sina",
            password: "password123"
        });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful.");
    expect(response.body.redirect).toBe("/index");

    expect(global.jobs.data.push).toHaveBeenCalledWith({
        type: "LOGIN_ANY",
        login: "sina",
        password: "password123"
    });
});

test("POST /login logs in council staff and redirects to council dashboard", async () => {
    global.jobs.data.push.mockResolvedValue({
        err: null,
        result: {
            role: "council",
            data: {
                id: 2,
                username: "admin"
            }
        }
    });

    const response = await request(app)
        .post("/login")
        .send({
            login: "admin",
            password: "password123"
        });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful.");
    expect(response.body.redirect).toBe("/council-dashboard");
});

test("POST /login returns 500 if job processor crashes", async () => {
    global.jobs.data.push.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
        .post("/login")
        .send({
            login: "sina",
            password: "password123"
        });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal server error.");
});