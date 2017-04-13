const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

app.get("/urls.json", (req, res) => {
  res.json(URLDatabase);
});

//---------------- FUNCTIONS
function generateRandomString() {
  var randString = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < 6; i++)
      randString += possible.charAt(Math.floor(Math.random() * possible.length));
    return randString;
}

//--------------- DATABASES
const URLDatabase = {
    "b2xVn2": {
      longURL: "http://www.lighthouselabs.ca" },
    "9sm5xK": {
      longURL: "http://www.google.com" }
};

// const users = [
//   {
//     id: 1,
//     username: "alvy",
//     password: "alvypw",
//     email: "alvy@hotmail.com"
//   },
//   {
//     id: 2,
//     username: "derp",
//     password: "derppw",
//     email: "derp@hotmail.com"
//   }
// ];


//-------------- ROOT
app.get("/", (req, res) => {
  var user = null;
  // console.log("reqcookieuser: ", req.cookies.user); // #
  if (req.cookies.user) {
    findUser(user)
    }
    res.redirect("urls");
  // } else {
  //   res.redirect("login");
  // }
});


//-------------- URLS
app.get("/urls", (req, res) => {
  console.log(req.cookies["username"]);
  let templateVars = {
    urls: URLDatabase,
    username: req.cookies["username"]
  };
  // console.log("templateVar: " + templateVars.urls);
  res.render("urls_index", templateVars);
});

//---------- Login
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  // let user = users.find(function(user) {
  //   return user.username == username;
  // });
  res.cookie(username);
  res.redirect("/");
});


//----------- Add generated short URL to database
app.post("/urls", (req, res) => {
  let generatedShortURL = generateRandomString();
  let longURL = req.body.longURL;
  const newURLId = {
    longURL: longURL
  };
  URLDatabase[generatedShortURL] = newURLId; // ie: obj[newProperty] = newValue
  // console.log("Short URL: ", generatedShortURL);
  // console.log("Long URL: ", newURLId.longURL);
  // console.log("Long URL in DB: ", URLDatabase[generatedShortURL].longURL);
  res.redirect(longURL);
});


//------- URL New
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


//------- Updating to new URL
app.post("/urls/:id", (req, res) => {
  let newURL = req.body.newLongURL;
  URLDatabase[req.params.id].longURL = newURL;
  res.redirect("/urls");
});


//------- Redirect to update page
app.get("/urls/:id", (req, res) => {
  // console.log("rpi1:" , req.params.id); kill
  // console.log("hard: " , "b2xVn2"); me
  // console.log("udb" , URLDatabase[req.params.id].longURL); now
  // console.log("wat" , URLDatabase["b2xVn2"].longURL);
  // console.log("DB" , URLDatabase);
  let templateVars = {
    shortURL: [req.params.id],
    longURL: URLDatabase[req.params.id].longURL
  };
  //console.log("temp vars: ", templateVars);
  res.render("urls_show", templateVars);
});


//------------ Redirects to original website
app.get("/u/:id", (req, res) => {
  let longURL = URLDatabase[req.params.id].longURL
  res.redirect(longURL);
});


//----------- Delete Button
app.post('/urls/:id/delete', (req, res) => {
  delete URLDatabase[req.params.id];
  res.redirect('/urls');
});


// --------------- Listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});