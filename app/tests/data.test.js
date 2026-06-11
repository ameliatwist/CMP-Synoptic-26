jest.mock("../db", () => ({
    oneOrNone: jest.fn(),
    one: jest.fn(),
    any: jest.fn(),
    none: jest.fn()
}));

jest.mock("bcrypt", () => ({
    compare: jest.fn(),
    hash: jest.fn()
}));

const db = require("../db");
const bcrypt = require("bcrypt");

const {
    push,
    TYPE_LOGIN_USER,
    TYPE_CREATE_USER,
    TYPE_LOGIN_COUNCIL,
    TYPE_LOGIN_ANY,
    TYPE_SUBMIT_REPORT,
    TYPE_GET_USER_POINTS,
    TYPE_REDEEM_POINTS,
    TYPE_GET_ALL_USERS_POINTS,
    TYPE_UPDATE_REPORT_STATUS
} = require("../jobs/data");

beforeEach(() => {
    jest.clearAllMocks();
});

test("login user fails when input is incomplete", async () => {
    const response = await push({
        type: TYPE_LOGIN_USER,
        login: "sina"
    });

    expect(response.err).toBe("incomplete input");
    expect(response.result).toBeNull();
});

test("login user fails when user is not found", async () => {
    db.oneOrNone.mockResolvedValue(null);

    const response = await push({
        type: TYPE_LOGIN_USER,
        login: "sina",
        password: "password123"
    });

    expect(response.err).toBe("User not found.");
    expect(response.result).toBeNull();
});

test("login user fails when password is wrong", async () => {
    db.oneOrNone.mockResolvedValue({
        id: 1,
        username: "sina",
        password: "hashedpassword"
    });

    bcrypt.compare.mockResolvedValue(false);

    const response = await push({
        type: TYPE_LOGIN_USER,
        login: "sina",
        password: "wrongpassword"
    });

    expect(response.err).toBe("Incorrect password.");
    expect(response.result).toBeNull();
});

test("login user succeeds with correct details", async () => {
    const fakeUser = {
        id: 1,
        username: "sina",
        email: "sina@test.com",
        password: "hashedpassword"
    };

    db.oneOrNone.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true);

    const response = await push({
        type: TYPE_LOGIN_USER,
        login: "sina",
        password: "password123"
    });

    expect(response.err).toBeNull();
    expect(response.result).toBe(fakeUser);
});

test("create user fails when input is incomplete", async () => {
    const response = await push({
        type: TYPE_CREATE_USER,
        username: "sina"
    });

    expect(response.err).toBe("incomplete input");
    expect(response.result).toBeNull();
});

test("create user fails when username or email already exists", async () => {
    db.oneOrNone.mockResolvedValue({
        id: 1,
        username: "sina"
    });

    const response = await push({
        type: TYPE_CREATE_USER,
        fullname: "Sina Taeid",
        username: "sina",
        email: "sina@test.com",
        password: "password123"
    });

    expect(response.err).toBe("Username or email already exists.");
    expect(response.result).toBeNull();
});

test("create user succeeds", async () => {
    const fakeUser = {
        id: 1,
        fullname: "Sina Taeid",
        username: "sina",
        email: "sina@test.com"
    };

    db.oneOrNone.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashedpassword");
    db.one.mockResolvedValue(fakeUser);

    const response = await push({
        type: TYPE_CREATE_USER,
        fullname: "Sina Taeid",
        username: "sina",
        email: "sina@test.com",
        password: "password123"
    });

    expect(response.err).toBeNull();
    expect(response.result).toBe(fakeUser);
});

test("login council succeeds", async () => {
    const fakeStaff = {
        id: 1,
        username: "admin",
        email: "admin@test.com",
        password: "hashedpassword"
    };

    db.oneOrNone.mockResolvedValue(fakeStaff);
    bcrypt.compare.mockResolvedValue(true);

    const response = await push({
        type: TYPE_LOGIN_COUNCIL,
        login: "admin",
        password: "password123"
    });

    expect(response.err).toBeNull();
    expect(response.result).toBe(fakeStaff);
});

test("login council fails when account is not found", async () => {
    db.oneOrNone.mockResolvedValue(null);

    const response = await push({
        type: TYPE_LOGIN_COUNCIL,
        login: "admin",
        password: "password123"
    });

    expect(response.err).toBe("Account not found.");
    expect(response.result).toBeNull();
});

test("login any returns user role when user login is correct", async () => {
    const fakeUser = {
        id: 1,
        username: "sina",
        password: "hashedpassword"
    };

    db.oneOrNone.mockResolvedValueOnce(fakeUser);
    bcrypt.compare.mockResolvedValueOnce(true);

    const response = await push({
        type: TYPE_LOGIN_ANY,
        login: "sina",
        password: "password123"
    });

    expect(response.err).toBeNull();
    expect(response.result.role).toBe("user");
    expect(response.result.data).toBe(fakeUser);
});

test("login any returns council role when council login is correct", async () => {
    const fakeStaff = {
        id: 1,
        username: "admin",
        password: "hashedpassword"
    };

    db.oneOrNone
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(fakeStaff);

    bcrypt.compare.mockResolvedValueOnce(true);

    const response = await push({
        type: TYPE_LOGIN_ANY,
        login: "admin",
        password: "password123"
    });

    expect(response.err).toBeNull();
    expect(response.result.role).toBe("council");
    expect(response.result.data).toBe(fakeStaff);
});

test("submit report fails when required fields are missing", async () => {
    const response = await push({
        type: TYPE_SUBMIT_REPORT,
        user_id: 1
    });

    expect(response.err).toBe("Missing required fields.");
    expect(response.result).toBeNull();
});

test("submit report succeeds", async () => {
    const fakeReport = {
        id: 1,
        user_id: 1,
        location: "Norwich",
        report_type: "street"
    };

    db.one.mockResolvedValue(fakeReport);
    db.none.mockResolvedValue();

    const response = await push({
        type: TYPE_SUBMIT_REPORT,
        user_id: 1,
        location: "Norwich",
        description: "Bin full"
    });

    expect(response.err).toBeNull();
    expect(response.result).toBe(fakeReport);
});

test("get user points returns points", async () => {
    db.one.mockResolvedValue({
        points: 150
    });

    const response = await push({
        type: TYPE_GET_USER_POINTS,
        user_id: 1
    });

    expect(response.err).toBeNull();
    expect(response.result).toBe(150);
});

test("redeem points fails when user has insufficient points", async () => {
    db.one.mockResolvedValue({
        points: 50
    });

    const response = await push({
        type: TYPE_REDEEM_POINTS,
        user_id: 1,
        reward_name: "Voucher",
        points_cost: 100
    });

    expect(response.err).toBe("Not enough points.");
    expect(response.result).toBeNull();
});

test("redeem points succeeds when user has enough points", async () => {
    db.one.mockResolvedValue({
        points: 200
    });

    db.none.mockResolvedValue();

    const response = await push({
        type: TYPE_REDEEM_POINTS,
        user_id: 1,
        reward_name: "Voucher",
        points_cost: 100
    });

    expect(response.err).toBeNull();
    expect(response.result).toBe(true);
});

test("get all users points returns users ordered by points", async () => {
    const fakeUsers = [
        {
            id: 1,
            username: "sina",
            fullname: "Sina Taeid",
            points: 200
        },
        {
            id: 2,
            username: "alex",
            fullname: "Alex Smith",
            points: 100
        }
    ];

    db.any.mockResolvedValue(fakeUsers);

    const response = await push({
        type: TYPE_GET_ALL_USERS_POINTS
    });

    expect(response.err).toBeNull();
    expect(response.result).toBe(fakeUsers);
});

test("update report status succeeds", async () => {
    const fakeReport = {
        id: 1,
        status: "approved"
    };

    db.one.mockResolvedValue(fakeReport);

    const response = await push({
        type: TYPE_UPDATE_REPORT_STATUS,
        report_id: 1,
        status: "approved"
    });

    expect(response.err).toBeNull();
    expect(response.result.status).toBe("approved");
});

test("unsupported queue type returns error", async () => {
    const response = await push({
        type: "NOT_REAL"
    });

    expect(response.err).toBe("unsupported input.type");
    expect(response.result).toBeNull();
});