// Route for handling user account creation, including form validation and interaction with the data layer
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("create");
});
// Handles the form submission for creating a new user account
router.post("/", async function (req, res) {
  const fullname = req.body.fullname?.trim();
  const username = req.body.username?.trim();
  const email = req.body.email?.trim();
  const password = req.body.password;

  if (!fullname || fullname.length < 3) {
    return res.status(400).json({ message: "Please enter your full name." });
  }

  if (!username || username.length < 3) {
    return res.status(400).json({ message: "Username must be at least 3 characters." });
  }

  if (!email || !email.includes("@")) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }
// Interact with the data layer to create the user account and handle any errors that may occur
  try {
    const userResult = await global.jobs.data.push({
      type: global.jobs.data.TYPE_CREATE_USER,
      fullname,
      username,
      email,
      password
    });

    if (userResult.err) {
      return res.status(400).json({ message: userResult.err });
    }

    const user = userResult.result;
    req.session.user = {
      id: user.id,
      username: user.username,
      fullname: user.fullname
    };

    return res.status(201).json({ message: "Account created successfully." });

  } catch (error) {
    console.error("Create account error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;