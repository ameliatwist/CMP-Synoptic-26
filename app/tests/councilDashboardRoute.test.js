const request = require("supertest");
const express = require("express");

const councilDashboardRouter = require("../routes/council-dashboard"); // change name if file is different

describe("GET /council-dashboard", () => {
    let app;

    beforeEach(() => {
        app = express();

        app.set("view engine", "ejs");

        // fake session
        app.use((req, res, next) => {
            req.session = {
                council: {
                    id: 1,
                    name: "Test Council"
                }
            };
            next();
        });

        // stop EJS from actually rendering
        app.response.render = jest.fn(function (view, data) {
            this.status(200).json({ view, data });
        });

        app.use("/council-dashboard", councilDashboardRouter);
    });

    test("renders dashboard with reports and stats", async () => {
        global.jobs = {
            data: {
                TYPE_GET_ALL_REPORTS: "GET_ALL_REPORTS",

                push: jest.fn().mockResolvedValue({
                    result: [
                        { id: 1, status: "approved" },
                        { id: 2, status: "pending" },
                        { id: 3, status: "collected" },
                        { id: 4, status: "rejected" },
                        { id: 5, status: "pending" }
                    ]
                })
            }
        };

        const response = await request(app)
            .get("/council-dashboard");

        expect(response.status).toBe(200);

        expect(global.jobs.data.push).toHaveBeenCalledWith({
            type: "GET_ALL_REPORTS"
        });

        expect(response.body.view).toBe("council-dashboard");

        expect(response.body.data.stats).toEqual({
            total: 5,
            approved: 1,
            pending: 2,
            collected: 1,
            rejected: 1
        });

        expect(response.body.data.reports).toHaveLength(5);
        expect(response.body.data.council.name).toBe("Test Council");
    });

    test("only sends first 10 reports to the page", async () => {
        const reports = Array.from({ length: 12 }, (_, i) => ({
            id: i + 1,
            status: "pending"
        }));

        global.jobs = {
            data: {
                TYPE_GET_ALL_REPORTS: "GET_ALL_REPORTS",
                push: jest.fn().mockResolvedValue({
                    result: reports
                })
            }
        };

        const response = await request(app)
            .get("/council-dashboard");

        expect(response.status).toBe(200);
        expect(response.body.data.reports).toHaveLength(10);
        expect(response.body.data.stats.total).toBe(12);
    });
});