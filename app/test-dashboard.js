const express = require("express");

const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.static("public"));

app.get("/report", (req, res) => {
    res.render("reportBin");
});

app.get("/", (req, res) => {
  res.render("dashboard", {
    userName: "Amelia",
    points: 320,
    reports: [
      {
        type: "Overflowing bin",
        location: "Park Road",
        status: "Pending"
      },
      {
        type: "Missed collection",
        location: "High Street",
        status: "Resolved"
      }
    ]
  });
});

app.listen(3000, () => {
  console.log("Dashboard running at http://localhost:3000");
});
