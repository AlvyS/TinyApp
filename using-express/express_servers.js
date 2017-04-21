//-------------------------------------------------EXPORTS-------------------------------------------------------//
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
// const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieSession = require('cookie-session');


//-------------------------------------------------MIDDLEWARE---------------------------------------------------//
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());
app.set("view engine", "ejs");
app.use(cookieSession( {
  name: 'session',
  keys: ["cookey"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours // Cookie Options
}));
app.get("/urls.json", (req, res) => {
  res.json(URLDatabase);
});


//---------------------------------------------- FUNCTIONS -----------------------------------------------------//
function generateRandomString() {
  var randString = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < 6; i++)
      randString += possible.charAt(Math.floor(Math.random() * possible.length));
    return randString;
}

function findEmail(obj) {
  for(var i in obj) {
    return obj[i].email;
  }
}

function urlsForUser(id) {
  let userDatabase = {};
  for (urlID in URLDatabase) {
    if (URLDatabase[urlID] !== undefined && URLDatabase[urlID].userID === id) {
      userDatabase[urlID] = URLDatabase[urlID]
    }
  }
  return userDatabase;
}


//----------------------------------------------- DATABASES --------------------------------------------------//
const URLDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "randomID1"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "randomID2"
  }
};

const userDB = {
  "randomID1": {
    id: "randomID1",
    password: bcrypt.hashSync('pw', 10),
    email: "alvy@hotmail.com"
  },
  "randomID2": {
    id: "randomID2",
    password: bcrypt.hashSync('pw', 10),
    email: "derp@hotmail.com"
  }
};


//------------------------------------------------ ROOT --------------------------------------------------//
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});


//------------------------------------------------ URLS -------------------------------------------------//
app.get("/urls", (req, res) => {
  // console.log("userDB: ", userDB);
  let id = req.session.user_id;
  if (id) {
    let templateVars = {
      urls: urlsForUser(id),
      user: userDB[id],
      currentUserEmail: userDB[id].email
    };
  // console.log("test1 ", req.session.user_id); //randomID2
  res.status(200).render("urls_index", templateVars);
  } else {
  res.status(401).send("Please login");
  }
});


//------------------------------------------------- Register ----------------------------------------------------//
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/");
  } else {
    res.status(200).render("register")
  }
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  const hashed_password = bcrypt.hashSync(password, 10);
  if (!email || !password) {
    res.status(400).send("Can't leave fields blank");
  }
  for (user in userDB) {
    if (email === userDB[user].email) {
      res.status(400).send("Email exists in database");
    }
  }
  let randomID = generateRandomString();
  userDB[randomID] = {
    id: randomID,
    email: email,
    password: hashed_password
  };
  req.session.user_id = userDB[user].id;
  res.redirect("/");
});


//----------------------------------------------- Login page -------------------------------------------------//
app.get("/login", (req, res) => {
  let templateVars = {
    users: req.session.user_id
  };
  if (req.session.user_id) {
    res.redirect("/");
  } else {
  res.render("login", templateVars);
  }
});

//---------------------------------------- Log in fields and checks ------------------------------------------//
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let success = false;
  for (user in userDB) {
    if (email == userDB[user].email) {
      var comparePassword = bcrypt.compareSync(password, userDB[user].password);  
      if (comparePassword) {
        success = true;
        currentUser = userDB[user].id;
      }
    }
  }
  if (success) {
    req.session.user_id = currentUser;
    res.redirect("/");
  } else {
    res.status(401).send("401 Wrong email and/or password")
  }
});


//-------------------------------------------- Logout -------------------------------------------------//
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});


//-------------------------------------- Convert URL -> Database ----------------------------------------//
app.post("/urls", (req, res) => {
  let generatedShortURL = generateRandomString();
  let longURL = req.body.longURL;
  const newURLId = {
    longURL: longURL,
    userID: req.session.user_id
  };
  URLDatabase[generatedShortURL] = newURLId; // ie: obj[newProperty] = newValue
  res.redirect("/urls");
});


//----------------------------------- Link to Generate new URL ----------------------------------//
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    // var testEmail = findEmail(userDB);
    let templateVars = {
      user: userDB[req.session.user_id]
    };
    res.status(200).render("urls_new", templateVars);
  } else {
    res.redirect("login");
  }
});


//-------------------------------------- Update existing URL --------------------------------------//
app.post("/urls/:id", (req, res) => {
  let newURL = req.body.longURL;
  URLDatabase[req.params.id].longURL = newURL;
  res.redirect("/urls");
});


//------------------------------- Get to page to update existing URL --------------------------------//
app.get("/urls/:id", (req, res) => {
  if (!URLDatabase[req.params.id]) {
    res.status(404).send('Doesnt exist');
  } else if (!req.session.user_id) {
    res.status(401).send('Please login');
  } else if (req.session.user_id !== URLDatabase[req.params.id].userID) {
    res.status(403).send('Wrong account');
  } else {
    let templateVars = {
      user: userDB,
      shortURL: [req.params.id],
      longURL: URLDatabase[req.params.id].longURL
    };
    res.render("urls_show", templateVars);
  }
});


//----------------------------- Redirects to original website --------------------------------//
app.get("/u/:id", (req, res) => {
  let longURL = URLDatabase[req.params.id].longURL
  if (URLDatabase[req.params.id]) {
    res.redirect(longURL);
  } else {
    res.status(404).send('404 not found');
  }
});


//------------------------------------ Delete Button ----------------------------------------------//
app.post('/urls/:id/delete', (req, res) => {
  delete URLDatabase[req.params.id];
  res.redirect('/urls');
});


// ---------------------------------------- Listen ---------------------------------------------//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});