const request = require("supertest");
const express = require("express");

const councilRoutesRouter = require("../routes/council-routes");

describe("GET /council-routes", () => {
    let app;

    beforeEach(() => {
        app = express();

        app.use((req, res, next) => {
            req.session = {
                council: {
                    id: 1,
                    name: "Test Council"
                }
            };
            next();
        });

        app.response.render = jest.fn(function (view, data) {
            this.status(200).json({ view, data });
        });

        app.use("/council-routes", councilRoutesRouter);
    });

    test("renders council routes page with area summary sorted by count", async () => {
        global.jobs = {
            data: {
                TYPE_GET_ALL_REPORTS: "GET_ALL_REPORTS",

                push: jest.fn().mockResolvedValue({
                    result: [
                        { id: 1, location: "Ladywood" },
                        { id: 2, location: "Edgbaston" },
                        { id: 3, location: "Ladywood" },
                        { id: 4, location: "Handsworth" },
                        { id: 5, location: "Ladywood" },
                        { id: 6, location: "Edgbaston" }
                    ]
                })
            }
        };

        const response = await request(app).get("/council-routes");

        expect(response.status).toBe(200);

        expect(global.jobs.data.push).toHaveBeenCalledWith({
            type: "GET_ALL_REPORTS"
        });

        expect(response.body.view).toBe("council-routes");

        expect(response.body.data.council).toEqual({
            id: 1,
            name: "Test Council"
        });

        expect(response.body.data.areaSummary).toEqual([
            { location: "Ladywood", count: 3 },
            { location: "Edgbaston", count: 2 },
            { location: "Handsworth", count: 1 }
        ]);
    });

    test("renders empty area summary when there are no reports", async () => {
        global.jobs = {
            data: {
                TYPE_GET_ALL_REPORTS: "GET_ALL_REPORTS",

                push: jest.fn().mockResolvedValue({
                    result: null
                })
            }
        };

        const response = await request(app).get("/council-routes");

        expect(response.status).toBe(200);
        expect(response.body.data.areaSummary).toEqual([]);
    });
});