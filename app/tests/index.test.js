const request = require("supertest");
const express = require("express");

const indexRouter = require("../routes/index");

describe("Index route", () => {
    let app;

    beforeEach(() => {
        app = express();

        app.use(express.urlencoded({ extended: false }));
        app.use(express.json());

        app.use((req, res, next) => {
            req.session = {
                user: {
                    id: 1,
                    username: "sina"
                }
            };
            next();
        });

        app.response.render = jest.fn(function (view, data) {
            this.status(200).json({ view, data });
        });

        app.use("/", indexRouter);
    });

    test("GET / renders index with user points and reports", async () => {
        global.jobs = {
            data: {
                TYPE_GET_USER_POINTS: "GET_USER_POINTS",
                TYPE_GET_REPORTS_FOR_USER: "GET_REPORTS_FOR_USER",

                push: jest.fn()
                    .mockResolvedValueOnce({ result: 40 })
                    .mockResolvedValueOnce({
                        result: [
                            { id: 1, location: "Ladywood" },
                            { id: 2, location: "Edgbaston" }
                        ]
                    })
            }
        };

        const response = await request(app).get("/");

        expect(response.status).toBe(200);

        expect(global.jobs.data.push).toHaveBeenCalledWith({
            type: "GET_USER_POINTS",
            user_id: 1
        });

        expect(global.jobs.data.push).toHaveBeenCalledWith({
            type: "GET_REPORTS_FOR_USER",
            user_id: 1
        });

        expect(response.body.view).toBe("index");
        expect(response.body.data.user.username).toBe("sina");
        expect(response.body.data.points).toBe(40);
        expect(response.body.data.reports).toHaveLength(2);
    });

    test("POST / returns 400 if location is empty", async () => {
        const response = await request(app)
            .post("/")
            .send({
                description: "Full bin",
                location: "   "
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Please enter a location.");
    });

    test("POST / submits report successfully", async () => {
        global.jobs = {
            data: {
                TYPE_SUBMIT_REPORT: "SUBMIT_REPORT",

                push: jest.fn().mockResolvedValue({
                    err: null,
                    result: true
                })
            }
        };

        const response = await request(app)
            .post("/")
            .send({
                description: "Bin is full",
                location: " Ladywood ",
                bin_level: "full",
                report_type: "bin",
                latitude: "52.4862",
                longitude: "-1.8904"
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe("Report submitted! +10 points.");

        expect(global.jobs.data.push).toHaveBeenCalledWith({
            type: "SUBMIT_REPORT",
            user_id: 1,
            description: "Bin is full",
            location: "Ladywood",
            bin_level: "full",
            report_type: "bin",
            latitude: "52.4862",
            longitude: "-1.8904"
        });
    });

    test("POST / returns 500 if report submission fails", async () => {
        global.jobs = {
            data: {
                TYPE_SUBMIT_REPORT: "SUBMIT_REPORT",

                push: jest.fn().mockResolvedValue({
                    err: "Database error",
                    result: null
                })
            }
        };

        const response = await request(app)
            .post("/")
            .send({
                description: "Bin is full",
                location: "Ladywood"
            });

        expect(response.status).toBe(500);
        expect(response.body.message).toBe("Database error");
    });
});