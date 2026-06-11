// Test suite for the council points route, verifying that the council points page is rendered with the correct users and points data based on the data returned from the data layer
const request = require("supertest");
const express = require("express");

const councilPointsRouter = require("../routes/council-points"); // change if your file name is different

describe("GET /council-points", () => {
    let app;

    beforeEach(() => {
        app = express();

        app.set("view engine", "ejs");

        reqSessionMiddleware = (req, res, next) => {
            req.session = {
                council: {
                    id: 1,
                    name: "Test Council"
                }
            };
            next();
        };

        app.use(reqSessionMiddleware);

        app.response.render = jest.fn(function (view, data) {
            this.status(200).json({ view, data });
        });

        app.use("/council-points", councilPointsRouter);
    });
// Verify that the route correctly retrieves the users and points data from the data layer and renders the council points page with the expected data
    test("renders council points page with users", async () => {
        global.jobs = {
            data: {
                TYPE_GET_ALL_USERS_POINTS: "GET_ALL_USERS_POINTS",

                push: jest.fn().mockResolvedValue({
                    result: [
                        { id: 1, username: "sina", points: 50 },
                        { id: 2, username: "alex", points: 30 }
                    ]
                })
            }
        };

        const response = await request(app).get("/council-points");

        expect(response.status).toBe(200);

        expect(global.jobs.data.push).toHaveBeenCalledWith({
            type: "GET_ALL_USERS_POINTS"
        });

        expect(response.body.view).toBe("council-points");

        expect(response.body.data.council).toEqual({
            id: 1,
            name: "Test Council"
        });

        expect(response.body.data.users).toEqual([
            { id: 1, username: "sina", points: 50 },
            { id: 2, username: "alex", points: 30 }
        ]);
    });

    test("renders empty users array if no result is returned", async () => {
        global.jobs = {
            data: {
                TYPE_GET_ALL_USERS_POINTS: "GET_ALL_USERS_POINTS",

                push: jest.fn().mockResolvedValue({
                    result: null
                })
            }
        };

        const response = await request(app).get("/council-points");

        expect(response.status).toBe(200);
        expect(response.body.data.users).toEqual([]);
    });
});