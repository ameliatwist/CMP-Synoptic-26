const express = require("express");
const session = require("express-session");
const request = require("supertest");

global.jobs = {
    data: {
        TYPE_CREATE_USER: "CREATE_USER",
        push: jest.fn()
    }
};

const createRoute = require("../routes/create");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: "test-secret",
    resave: false,
    saveUninitialized: true
}));

app.use("/create", createRoute);

beforeEach(() => {
    jest.clearAllMocks();
});

test("POST /create returns 400 when fullname is too short", async () => {
    const response = await request(app)
        .post("/create")
        .send({
            fullname: "Si",
            username: "sina",
            email: "sina@test.com",
            password: "password123"
        });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Please enter your full name.");
});

test("POST /create returns 400 when username is too short", async () => {
    const response = await request(app)
        .post("/create")
        .send({
            fullname: "Sina Taeid",
            username: "si",
            email: "sina@test.com",
            password: "password123"
        });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Username must be at least 3 characters.");
});

test("POST /create returns 400 when email is invalid", async () => {
    const response = await request(app)
        .post("/create")
        .send({
            fullname: "Sina Taeid",
            username: "sina",
            email: "sina-test.com",
            password: "password123"
        });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Please enter a valid email address.");
});

test("POST /create returns 400 when password is too short", async () => {
    const response = await request(app)
        .post("/create")
        .send({
            fullname: "Sina Taeid",
            username: "sina",
            email: "sina@test.com",
            password: "123"
        });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Password must be at least 8 characters.");
});

test("POST /create returns 400 when username or email already exists", async () => {
    global.jobs.data.push.mockResolvedValue({
        err: "Username or email already exists.",
        result: null
    });

    const response = await request(app)
        .post("/create")
        .send({
            fullname: "Sina Taeid",
            username: "sina",
            email: "sina@test.com",
            password: "password123"
        });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Username or email already exists.");
});

test("POST /create creates account successfully", async () => {
    global.jobs.data.push.mockResolvedValue({
        err: null,
        result: {
            id: 1,
            username: "sina",
            fullname: "Sina Taeid"
        }
    });

    const response = await request(app)
        .post("/create")
        .send({
            fullname: "Sina Taeid",
            username: "sina",
            email: "sina@test.com",
            password: "password123"
        });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Account created successfully.");

    expect(global.jobs.data.push).toHaveBeenCalledWith({
        type: "CREATE_USER",
        fullname: "Sina Taeid",
        username: "sina",
        email: "sina@test.com",
        password: "password123"
    });
});

test("POST /create trims fullname, username and email before sending to job processor", async () => {
    global.jobs.data.push.mockResolvedValue({
        err: null,
        result: {
            id: 1,
            username: "sina",
            fullname: "Sina Taeid"
        }
    });

    await request(app)
        .post("/create")
        .send({
            fullname: "  Sina Taeid  ",
            username: "  sina  ",
            email: "  sina@test.com  ",
            password: "password123"
        });

    expect(global.jobs.data.push).toHaveBeenCalledWith({
        type: "CREATE_USER",
        fullname: "Sina Taeid",
        username: "sina",
        email: "sina@test.com",
        password: "password123"
    });
});

test("POST /create returns 500 if job processor crashes", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    global.jobs.data.push.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
        .post("/create")
        .send({
            fullname: "Sina Taeid",
            username: "sina",
            email: "sina@test.com",
            password: "password123"
        });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal server error.");

    console.error.mockRestore();
});