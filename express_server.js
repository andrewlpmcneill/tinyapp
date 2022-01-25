const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.redirect("/urls");
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});


app.post("/urls", (req, res) => {
  const short = generateRandomString();         // Respond with 'Ok' (we will replace this)
  urlDatabase[short] = req.body.longURL;
  const templateVars = { shortURL: short, longURL: urlDatabase[short], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});