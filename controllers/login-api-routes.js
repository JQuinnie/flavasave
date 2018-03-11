// Requiring our models and passport as we've configured it
const db = require("../models");
const passport = require("../config/passport");
const validateInput = require("../scripts/validations/signup");
const isEmpty = require("lodash.isempty");
const bcrypt = require("bcrypt");

module.exports = function(app) {
  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  // app.post("/api/login", passport.authenticate("local"), function(req, res) {
  //   // Since we're doing a POST with javascript, we can't actually redirect that post into a GET request
  //   // So we're sending the user back the route to the members page because the redirect will happen on the front end
  //   // They won't get this or even be able to access this page if they aren't authed
  //   res.json("/userpage"); //redirect?
  // });

  // User Login set up for React
  // Route for logging in a user by username or email
  app.post("/api/login", function(req, res) {
    const { username, password } = req.body;

    db.User.findOne({
      where: { username: username }
    }).then(user => {
      if (user) {
        if (bcrypt.compareSync(password, user.get("password"))) {
        } else {
          res.status(401).json({ errors: { form: "Invalid Credentials" } });
        }
      } else {
        res.status(401).json({ errors: { form: "Invalid Credentials" } });
      }
    });
  });

  // User Sign Up route set up for React
  // High order function to first check if there is an existing email/username
  function validateInputQuery(data, otherValid) {
    let { errors } = otherValid(data);

    return db.User.findOne({
      where: { email: data.email },
      or: { username: data.username }
    }).then(function(user) {
      if (user) {
        if (user.get("username") === data.username) {
          errors.username = "Sorry, this username is already taken";
        }
        if (user.get("email") == data.email) {
          errors.email = "Sorry, this E-mail is already taken";
        }
      }
      return {
        errors,
        isValid: isEmpty(errors)
      };
    });
  }

  // Route for signing up a user, use validateInputQuery function first to identify existing usernames or emails then if isValid, continue on to the db to create user data
  app.post("/api/userSignUp", function(req, res) {
    validateInputQuery(req.body, validateInput).then(({ errors, isValid }) => {
      if (isValid) {
        // console.log(req.body);
        const { firstname, lastname, username, email, password } = req.body;

        db.User.create({ firstname, lastname, username, email, password })
          .then(user => res.json({ success: true }))
          .catch(error => res.status(500).json({ error: error }));
      } else {
        res.status(400).json(errors);
      }
    });
  });

  // Route for logging user out
  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });

  // Route for getting some data about our user to be used client side
  app.get("/api/user_data", function(req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        email: req.user.email,
        id: req.user.id
      });
    }
  });
};
