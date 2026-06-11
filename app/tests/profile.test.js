// Test suite for the profile route, verifying that the route correctly retrieves user profile and report stats from the data layer, renders the profile page with the expected data, and handles errors appropriately
const request = require("supertest");
const express = require("express");

const profileRouter = require("../routes/profile");

describe("GET /profile", () => {
    let app;

    beforeEach(() => {
        app = express();

        app.use((req, res, next) => {
            req.session = {
                user: {
                    id: 1,
                    username: "sina"
                },
                rewardError: "Not enough points"
            };
            next();
        });

        app.response.render = jest.fn(function (view, data) {
            this.status(200).json({ view, data });
        });

        app.use("/profile", profileRouter);
    });

    test("renders profile page with user profile and report stats", async () => {
        global.jobs = {
            data: {
                TYPE_GET_USER_PROFILE: "GET_USER_PROFILE",

                push: jest.fn().mockResolvedValue({
                    err: null,
                    result: {
                        user: {
                            id: 1,
                            username: "sina",
                            points: 50
                        },
                        reportStats: {
                            total: 3,
                            approved: 2,
                            pending: 1
                        }
                    }
                })
            }
        };

        const response = await request(app).get("/profile");

        expect(response.status).toBe(200);

        expect(global.jobs.data.push).toHaveBeenCalledWith({
            type: "GET_USER_PROFILE",
            user_id: 1
        });

        expect(response.body.view).toBe("profile");

        expect(response.body.data.user).toEqual({
            id: 1,
            username: "sina"
        });

        expect(response.body.data.profile).toEqual({
            id: 1,
            username: "sina",
            points: 50
        });

        expect(response.body.data.reportStats).toEqual({
            total: 3,
            approved: 2,
            pending: 1
        });

        expect(response.body.data.flashError).toBe("Not enough points");
    });

    test("redirects to /index if profile result has error", async () => {
        global.jobs = {
            data: {
                TYPE_GET_USER_PROFILE: "GET_USER_PROFILE",

                push: jest.fn().mockResolvedValue({
                    err: "Database error",
                    result: null
                })
            }
        };

        const response = await request(app).get("/profile");

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/index");
    });
});