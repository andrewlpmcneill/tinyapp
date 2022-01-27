const express = require("express");
const cookieSession = require("cookie-session");
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {};

const users = {};

const generateRandomString = () => {
  let output = '';
  while (output.length < 6) {
    const gate = Math.ceil(Math.random() * 2);
    let number = '';
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let letter = '';
    let upperOrLower = Math.ceil(Math.random() * 2);
    
    switch (gate) {
    case 1:
      number = Math.floor(Math.random() * 10);
      output += String(number);
      break;
    case 2:
      letter = alphabet[Math.floor(Math.random() * alphabet.length)];
      if (upperOrLower === 1) {
        output += letter;
        break;
      }
      output += letter.toUpperCase();
      break;
    }
  }
  return output;
};

const emailLookup = (email) => {
  for (let user in users) {
    if (users[user]['email'] === email) {
      return user;
    }
  }
  return false;
};

const urlsForUser = (id) => {
  const userURLs = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url]['userID'] === id) {
      userURLs[url] = urlDatabase[url]['longURL'];
    }
  }
  return userURLs;
};

const currentUser = (req, res, next) => {
  const userId = req.session['user_id'];
  req.userID = userId;
  req.currentUser = users[userId];
  next();
};

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(currentUser);

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = { user: null };
  res.render("register_new", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlsForUser(req.userID), user: req.currentUser, id: req.userID };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.currentUser) {
    res.redirect('/login');
  }
  const templateVars = { user: req.currentUser };
  res.render("urls_new", templateVars);
});


app.get("/login", (req, res) => {
  const templateVars = { user: req.currentUser };
  res.render("login_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!req.currentUser || urlDatabase[req.params.id]['userID'] !== req.userID) {
    res.redirect("/urls");
  }
  const templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id]['longURL'], user: req.currentUser, id: req.userID };
  res.render("urls_show", templateVars);
});


app.post("/urls", (req, res) => {
  if (!req.currentUser) {
    res.status(403).send('You must be logged in to create new URLs.');
  }
  const short = generateRandomString();
  urlDatabase[short] = {};
  urlDatabase[short]['longURL'] = req.body.longURL;
  urlDatabase[short]['userID'] = req.userID;
  res.redirect(`urls/${short}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.currentUser || urlDatabase[req.params.shortURL]['userID'] !== req.userID) {
    res.status(403).send('You can only delete URLs that belong to you.');
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL]['longURL'] = req.body.newURL;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password || emailLookup(req.body.email)) {
    res.status(400).send('Registration details empty, or the user already exists.');
  }
  const id = generateRandomString();
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = {
    email: req.body.email,
    password: hashedPassword
  };
  req.session['user_id'] = id;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  if (!emailLookup(req.body.email)) {
    res.status(403).send("The email you entered isn't connected to an account.");
    return;
  }
  const user = emailLookup(req.body.email);
  if (!bcrypt.compareSync(req.body.password, users[user]['password'])) {
    res.status(403).send("The password you entered is incorrect.");
  }
  req.session['user_id'] = user;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session['user_id'] = null;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});