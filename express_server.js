// SETUP, IMPORT DEPENDENCIES

const express = require("express");
const cookieSession = require("cookie-session");
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const morgan = require('morgan');
const app = express();
const PORT = 8080;
const { generateRandomString, getUserByEmail, urlsForUser, timeStamp } = require('./helpers.js');
app.set("view engine", "ejs");
app.set('trust proxy', 1);
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(methodOverride('_method'));
app.use(morgan('tiny'));
const currentUser = (req, res, next) => { // Custom middleware - keeps routes DRY
  const userId = req.session['user_id'];
  req.userID = userId;
  req.currentUser = users[userId];
  next();
};
app.use(currentUser);


// DATA OBJECTS

const urlDatabase = {};
const users = {};


// ROUTES

// Root, redirects to /urls unless user is unvalidated
app.get("/", (req, res) => {
  if (req.userID && req.currentUser) {
    res.redirect("/urls");
    return;
  }
  res.redirect("/login");
});

// Registration, renders registration view unless user is already validated
app.get("/register", (req, res) => {
  if (req.userID && req.currentUser) {
    res.redirect("/urls");
    return;
  }
  const templateVars = {
    user: null
  };
  res.render("register_new", templateVars);
});

// Registration, creates user w. unique ID, hashed password, and stored email
app.post("/register", (req, res) => {
  // If the email is already registered, or if either of the fields are left empty, send a warning
  if (!req.body.email || !req.body.password || getUserByEmail(req.body.email, users)) {
    res.status(400).send('Registration details empty, or the user already exists. Please try again.');
    return;
  }
  // Otherwise, create unique ID, hashed password, set a cookie, update database, redirect to URL database view
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  users[id] = {
    email: req.body.email,
    password: hashedPassword
  };
  req.session['user_id'] = id;
  res.redirect("/urls");
});

// Login, renders login view, unless user is already validated
app.get("/login", (req, res) => {
  if (req.userID && req.currentUser) {
    res.redirect("/urls");
    return;
  }
  const templateVars = { user: req.currentUser };
  res.render("login_new", templateVars);
});

// Login, validates user, creates encrypted cookie, unless login details are invalid
app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  // Email not in database
  if (!user) {
    res.status(404).send("The email you entered isn't connected to an account.");
    return;
  }
  // Password doesn't match:
  if (!bcrypt.compareSync(req.body.password, users[user]['password'])) {
    res.status(403).send("The password you entered is incorrect.");
    return;
  }
  req.session['user_id'] = user;
  res.redirect("/urls");
});

// Logout, wipes cookie, ends session
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

// URL List, lists users URLs, allows editing and deleting, or handles unvalidated users
app.get("/urls", (req, res) => {
  // If user is not logged in, send error message
  if (!req.currentUser) {
    res.status(404).send("To view or create URLs, please log in or register an account first.");
    return;
  }
  const templateVars = {
    urls: urlsForUser(req.userID, urlDatabase),
    user: req.currentUser,
    urlDatabase: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// Creates URL, generates unique ID, stores as JSON, or handles unvalidated users
app.post("/urls", (req, res) => {
  if (!req.currentUser) {
    res.status(403).send('You must be logged in to create new URLs.');
    return;
  }
  // If the user is logged in, create a new entry in the database, and redirect them to the view/edit page for this new short URL
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.userID,
    created: timeStamp(),
    views: 0,
    viewers: [],
    timeStamp: []
  };
  res.redirect(`urls/${shortURL}`);
});

// New URL page, or handles unvalidated users
app.get("/urls/new", (req, res) => {
  if (!req.currentUser) {
    res.redirect('/login');
    return;
  }
  const templateVars = {
    user: req.currentUser
  };
  res.render("urls_new", templateVars);
});

// Redirects to desired long URL using short URL, handles invalid URLs
app.get("/u/:shortURL", (req, res) => {
  // Look up the URL in the database
  const URL_ID = urlDatabase[req.params.shortURL];
  if (!URL_ID) {
    res.status(404).send('This short URL does not exist or does not point to a valid address. Please try again with a valid short URL.');
    return;
  }
  
  // If it is in the database and a valid address...
  // ***STRETCH BEGINS*** //
  // Add 1 to total views in its database entry
  URL_ID['views']++;
  // Add 1 to unique views in its database entry, but only if it is the first time this user ID has used this link
  if (!URL_ID['viewers'].includes(req.userID)) {
    URL_ID['viewers'].push(req.userID);
    // Every non-logged in view gets a cookie and a user ID
  } else if (!req.userID) {
    req.session['user_id'] = generateRandomString();
    URL_ID['viewers'].push(req.session['user_id']);
  }
  // Add viewer ID ('guest' if not a registered user) and timestamp to each visit
  URL_ID['timeStamp'].push([req.userID, timeStamp()]);
  // ***STRETCH ENDS*** //

  const longURL = URL_ID['longURL'];
  res.redirect(longURL);
});

// Individual URL page, allows re-mapping of long URLs, handles invalid URLs and unvalidated users
app.get("/urls/:shortURL", (req, res) => {
  const URL_ID = urlDatabase[req.params.shortURL];
  if (!URL_ID) {
    res.status(404).send('ShortURL not found. Please enter an existing shortURL.');
    return;
  }
  if (!req.currentUser || URL_ID['userID'] !== req.userID) {
    res.status(403).send("You can only view or edit shortURLs that you have created.");
    return;
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: URL_ID['longURL'],
    user: req.currentUser,
    viewCount: URL_ID['views'],
    viewers: URL_ID['viewers'].length,
    timeStamp: URL_ID['timeStamp']
  };
  res.render("urls_show", templateVars);
});

// Updates database with new longURL
// ***STRETCH***
// METHOD OVERRIDE - 'PUT' INSTEAD OF 'POST'
app.put("/urls/:shortURL", (req, res) => {
  // If user requesting update is not the owner of the short URL, send error
  if (!req.currentUser || urlDatabase[req.params.shortURL]['userID'] !== req.userID) {
    res.status(403).send('You can only update URLs that belong to you.');
    return;
  }
  urlDatabase[req.params.shortURL]['longURL'] = req.body.newURL;
  res.redirect("/urls");
});

// Deletes an entry in URL database, redirects to URL database view
// ***STRETCH***
// METHOD OVERRIDE - 'DELETE' INSTEAD OF 'POST'
app.delete("/urls/:shortURL/delete", (req, res) => {
  // If user requesting delete is not the owner of the short URL, send error
  if (!req.currentUser || urlDatabase[req.params.shortURL]['userID'] !== req.userID) {
    res.status(403).send('You can only delete URLs that belong to you.');
    return;
  }
  // If user is the owner of the short URL, delete it from the database, redirect to URL database view
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});