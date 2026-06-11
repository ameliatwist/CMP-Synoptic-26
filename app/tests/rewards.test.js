const request = require("supertest");
const express = require("express");

const rewardsRouter = require("../routes/rewards"); // change if file name is different

describe("Rewards route", () => {
    let app;
    let sessionData;

    beforeEach(() => {
        app = express();

        app.use(express.urlencoded({ extended: false }));
        app.use(express.json());

        sessionData = {
            user: {
                id: 1,
                username: "sina"
            }
        };

        app.use((req, res, next) => {
            req.session = sessionData;
            next();
        });

        app.use("/rewards", rewardsRouter);
    });

    test("GET /rewards redirects to /profile", async () => {
        const response = await request(app).get("/rewards");

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/profile");
    });

    test("POST /rewards redeems points and redirects to /profile", async () => {
        global.jobs = {
            data: {
                TYPE_REDEEM_POINTS: "REDEEM_POINTS",

                push: jest.fn().mockResolvedValue({
                    err: null,
                    result: true
                })
            }
        };

        const response = await request(app)
            .post("/rewards")
            .send({
                reward_name: "Free Coffee",
                points_cost: "50"
            });

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/profile");

        expect(global.jobs.data.push).toHaveBeenCalledWith({
            type: "REDEEM_POINTS",
            user_id: 1,
            reward_name: "Free Coffee",
            points_cost: 50
        });
    });

    test("POST /rewards stores reward error if redeem fails", async () => {
        global.jobs = {
            data: {
                TYPE_REDEEM_POINTS: "REDEEM_POINTS",

                push: jest.fn().mockResolvedValue({
                    err: "Not enough points",
                    result: null
                })
            }
        };

        const response = await request(app)
            .post("/rewards")
            .send({
                reward_name: "Free Coffee",
                points_cost: "100"
            });

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/profile");

        expect(sessionData.rewardError).toBe("Not enough points");
    });
});