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

// Root, redirects to /urls
app.get("/", (req, res) => {
  if (req.userID) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});

// Registration, renders registration view
app.get("/register", (req, res) => {
  if (req.userID) {
    res.redirect("/urls");
  }
  const templateVars = { user: null };
  res.render("register_new", templateVars);
});

// Registration, creates user w. unique ID, hashed password, and stored email
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password || getUserByEmail(req.body.email, users)) {
    res.status(400).send('Registration details empty, or the user already exists.');
  }
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  users[id] = {
    email: req.body.email,
    password: hashedPassword
  };
  req.session['user_id'] = id;
  res.redirect("/urls");
});

// Login, renders login view
app.get("/login", (req, res) => {
  if (req.userID) {
    res.redirect("/urls");
  }
  const templateVars = { user: req.currentUser };
  res.render("login_new", templateVars);
});

// Login, validates user, creates encrypted cookie
app.post("/login", (req, res) => {
  if (!getUserByEmail(req.body.email, users)) {
    res.status(403).send("The email you entered isn't connected to an account.");
    return;
  }
  const user = getUserByEmail(req.body.email, users);
  if (!bcrypt.compareSync(req.body.password, users[user]['password'])) {
    res.status(403).send("The password you entered is incorrect.");
  }
  req.session['user_id'] = user;
  res.redirect("/urls");
});

// Logout, wipes cookie, ends session
app.post("/logout", (req, res) => {
  req.session['user_id'] = null;
  res.redirect("/urls");
});

// URL List, lists users URLs, allows editing and deleting
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlsForUser(req.userID, urlDatabase), user: req.currentUser, urlDatabase: urlDatabase };
  res.render("urls_index", templateVars);
});

// Creates URL, generates unique ID, stores in as JSON
app.post("/urls", (req, res) => {
  if (!req.currentUser) {
    res.status(403).send('You must be logged in to create new URLs.');
  }
  const short = generateRandomString();
  urlDatabase[short] = {
    longURL: req.body.longURL,
    userID: req.userID,
    created: timeStamp(),
    views: 0,
    viewers: [],
    timeStamp: []
  };
  res.redirect(`urls/${short}`);
});

// New URL page
app.get("/urls/new", (req, res) => {
  if (!req.currentUser) {
    res.redirect('/login');
  }
  const templateVars = { user: req.currentUser };
  res.render("urls_new", templateVars);
});

// Redirects to desired long URL using short URL
app.get("/u/:shortURL", (req, res) => {
  const URL_ID = urlDatabase[req.params.shortURL];
  const longURL = URL_ID['longURL'];
  
  // ***STRETCH BEGINS*** //
  // Add 1 to total views
  URL_ID['views']++;
  // Add 1 to unique views, only if unique
  if (!URL_ID['viewers'].includes(req.userID)) {
    URL_ID['viewers'].push(req.userID);
  // Every 'guest' view counts as unique
  } else if (!req.userID) {
    URL_ID['viewers'].push(generateRandomString());
  }
  // Add viewer ID ('guest' if not a registered user) and timestamp to each visit
  if (!req.userID) {
    URL_ID['timeStamp'].push(['guest', timeStamp()]);
  } else {
    URL_ID['timeStamp'].push([req.userID, timeStamp()]);
  }
  // ***STRETCH ENDS*** //
  res.redirect(longURL);
});

// Individual URL page, allows re-mapping of long URL
app.get("/urls/:shortURL", (req, res) => {
  const URL_ID = urlDatabase[req.params.shortURL];
  if (!URL_ID) {
    res.send('ShortURL not found. Please enter an existing shortURL.');
  }
  if (!req.currentUser || URL_ID['userID'] !== req.userID) {
    res.send("You can only view shortURLs that you have created.");
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: URL_ID['longURL'], user: req.currentUser, viewCount: URL_ID['views'], viewers: URL_ID['viewers'].length, timeStamp: URL_ID['timeStamp'] };
  res.render("urls_show", templateVars);
});

// Updates database with new longURL
app.put("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL]['longURL'] = req.body.newURL;
  res.redirect("/urls");
});

// Deletes an entry in URL database, redirects to URLs list
app.delete("/urls/:shortURL/delete", (req, res) => {
  if (!req.currentUser || urlDatabase[req.params.shortURL]['userID'] !== req.userID) {
    res.status(403).send('You can only delete URLs that belong to you.');
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});