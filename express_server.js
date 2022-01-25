const express = require("express");
const app = express();
const bodyParser = require('body-parser');
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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});