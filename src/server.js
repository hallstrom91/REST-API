/* 
!!! START OF INFO !!!

database name = nodejs_login

table 1 for registered users = name: register
register (name, username, password, email)

CREATE TABLE IF NOT EXISTS `register` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;



table 2 for saved comments = name: comments
comments (name, message)

CREATE TABLE IF NOT EXISTS `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `message` varchar(2000) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;



Or Change values to connect to your own database below!

!!! END OF INFO !!!
*/

/*
============================
Setup API
============================
*/
const express = require("express");
const session = require("express-session");
const crypto = require("crypto");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");
const bodyParser = require("body-parser");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

/*
============================
SQL Database 
============================
*/


console.log("Server is running on port " + process.env.PORT);

//Get crypto-key for session-secret
/* const sessionSecret = crypto.randomBytes(32).toString("hex");
console.log(sessionSecret); */

//Get crypto-key for jwt-secret
/* const jwtSecret = crypto.randomBytes(32).toString("hex");
console.log(jwtSecret); */

// Connection to mySQL DB
const connectDB = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Check if connection is established or not.
connectDB.connect((error) => {
  if (error) {
    console.log("Trouble with establishing database connection", error);
  } else {
    console.log(
      "Database connected sucessfully! SQL Thread-ID = " + connectDB.threadId
    );
  }
});

/*
============================
Middleware 
============================
*/

// Handle session and json
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

app.listen(process.env.PORT, () => {});

//Logs every incoming request and user-ip in CMD
app.use((request, response, next) => {
  console.log(
    `[${new Date().toLocaleString()}] [USER-IP ${request.ip}] ${
      request.method
    } ${request.url} `
  );
  next();
});

/*
============================
HTML Display
============================
*/

// CSS and client side JS (no JS file in this project thou)
app.use(express.static(path.join(__dirname, "static")));

// HTML
app.get("/", (request, response) => {
  response.sendFile(path.join(__dirname,  "../public/index.html"));
});

/*
============================
JWT AND CRYPTO
============================
*/

// JWT Authorization Function to be called in DELETE AND PUT.
// DO NOT WORK CORRECTLY! Call for authToken in desired script like:
// app.get("/users/:id?", authToken, function (request, response) {
// or
// app.get("/users/:id?", authToken (request, response) => {
// but to get it to wokr you need to put user jwt in token and prefix input, click send and get error several times
// then remove from token input and leave jwt token in prefix and you will get access. Holy crap that one f- my mind for many hours.

/* const authToken = async (request, response, next) => {
  const token = request.header("Authorization");

  if (!token) {
    return response.status(401).send("Missing Token!");
  }
  try {
    const user = await jwt.verify(token, process.env.JWT_SECRET);
    request.user = user; // jwt-payload?!
    console.log(token);
    next();
  } catch (err) {
    console.error(err);
    return response.status(403).send("Invalid Token!");
  }
}; */

/* function authToken(request, response, next) {
  const token = request.header("Authorization");

  if (!token) {
    return response.sendStatus(401);
  } else {
    decode = jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return response.sendStatus(403);
      } else {
        request.user = user;
        next();
      }
    });
  }
} */

//hash function for password
function cryptohash(data) {
  const cryptohash = crypto.createHash("sha256");
  cryptohash.update(data);
  return cryptohash.digest("hex");
}

/*
============================
GET (USERS REQ JWT)
============================
*/

// get all users or singel-user with command /users/ID or /users (REQ JWT)
app.get("/users/:id?", function (request, response) {
  // Require JWT and decode
  let authJWT = request.headers["authorization"];
  if (authJWT === undefined) {
    response.sendStatus(400).send("Token saknas.");
    return;
  }

  let token = authJWT.slice(7);

  // decrypt and compare user-token with jwt_secret
  let decrypt;
  try {
    decrypt = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log(err);
    response
      .status(401)
      .send("Felaktigt eller saknat Token! Vänligen fyll i ditt login-token!");
    return;
  }
  // if token is correct, run this code!

  let userID = request.params.id;
  let sqlDB = "SELECT * FROM register";
  let parameters = [];

  if (userID) {
    sqlDB += " WHERE id = ?";
    parameters.push(userID);
  }
  connectDB.query(sqlDB, parameters, function (err, result, fields) {
    if (err) {
      console.log("Error with query", err);
      response.status(500).send("Server Error");
    } else {
      response.send(result);
    }
  });
});

// get all comments or specific comment thru id /comments/ID or /comments
app.get("/comments/:id?", function (request, response) {
  let commentID = request.params.id;
  let sqlDB = "SELECT * FROM comments";
  let parameters = [];

  if (commentID) {
    sqlDB += " WHERE id = ?";
    parameters.push(commentID);
  }
  connectDB.query(sqlDB, parameters, function (err, result, fields) {
    if (err) {
      console.log("Error with query", err);
      response.status(500).send("Server Error");
    } else {
      response.send(result);
    }
  });
});

/*
============================
POST
============================
*/

// POST new user to DB thru insomnia and json-format /addUser (NO JWT REQ)
app.post("/addUser", function (request, response) {
  const { name, username, password, email } = request.body;
  // confirm that no input value is empty
  if (!name && !username && !password && !email) {
    return response.status(400).send("Alla fält måste fyllas i!");
  } else if (!name) {
    return response.status(400).send("Namn måste fyllas i!");
  } else if (!username) {
    return response.status(400).send("Användarnamn måste fyllas i!");
  } else if (!password) {
    return response.status(400).send("Lösenord måste fyllas i!");
  } else if (!email) {
    return response.status(400).send("Email måste fyllas i!");
  } else {
    //take value from password and encrypt
    const hashedPW = cryptohash(password);
    const sqlDB =
      "INSERT INTO register (name, username, password, email) VALUES (?, ?, ?, ?)";
    const values = [name, username, hashedPW, email];

    connectDB.query(sqlDB, values, function (err, result, fields) {
      if (err) {
        console.error("Error with query", err);
        response.status(500).send("Server Error");
      } else {
        response.status(201).send("En ny användare är inlagd i databasen!"); // 201 STATUS - CREATED
      }
    });
  }
});

// Post new comment to DB thru insomnia and json-format /addComment (NO JWT REQ)
app.post("/addComment", function (request, response) {
  const { name, message } = request.body;
  //confirm no empty values
  if (!name && !message) {
    return response
      .status(400)
      .send("Alla fält måste fyllas i för att göra ett inlägg!");
  } else if (!name) {
    return response.status(400).send("Fyll i namn!");
  } else if (!message) {
    return response.status(400).send("Fyll i ett meddelande");
  } else {
    const sqlDB = "INSERT INTO comments (name, message) VALUES (?, ?)";
    const values = [name, message];

    connectDB.query(sqlDB, values, function (err, result, fields) {
      if (err) {
        console.log("Error with query", err);
        response.send(500).send("Server Error");
      } else {
        response.status(201).send("Ett nytt gästboks-inlägg är skapat!"); // 201 STATUS - CREATED
      }
    });
  }
});

/*
============================
PUT (REQ JWT)
============================
*/

// change value on specific user thru /editUser/ID (REQ JWT)
app.put("/editUser/:id", function (request, response) {
  // Require JWT and decode
  let authJWT = request.headers["authorization"];
  if (authJWT === undefined) {
    response.sendStatus(400).send("Token saknas.");
    return;
  }

  let token = authJWT.slice(7);

  // decrypt and compare user-token with jwt_secret
  let decrypt;
  try {
    decrypt = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log(err);
    response.status(401).send("Ogiltigt Token!");
    return;
  }
  // if token is correct, run this code!

  if (!request.params && !request.params.id) {
    return response.status(400).send("Ogiltig förfrågan.");
  }

  const userID = request.params.id;
  const { name, username, password, email } = request.body;

  if (!name && !username && !password && !email) {
    return response
      .status(400)
      .send("Alla fält måste fyllas i för att ändras!");
  } else if (!name) {
    return response.status(400).send("Namn måste fyllas i för att ändras!");
  } else if (!username) {
    return response
      .status(400)
      .send("Användarnamn måste fyllas i för att ändras!!");
  } else if (!password) {
    return response
      .status(400)
      .send("Lösenord måste fyllas i för att ändras!!");
  } else if (!email) {
    return response.status(400).send("Email måste fyllas i för att ändras!!");
  } else {
  }
  // hash updated password to DB.
  const hashedPW = cryptohash(password);
  const sqlDB =
    "UPDATE register SET name = ?, username = ?, password = ?, email = ? WHERE id = ? ";
  const values = [name, username, hashedPW, email, userID];

  connectDB.query(sqlDB, values, function (err, result, fields) {
    if (err) {
      console.log("Error with query", err);
      response.status(500).send("Server Error");
    } else {
      response.status(200).send("Användaruppgifterna har uppdaterats!"); // 200 - OK STATUS
    }
  });
});

// change value on specific guestbook-comment thru /editComment/ID (REQ JWT)
app.put("/editComment/:id", function (request, response) {
  // Require JWT and decode
  let authJWT = request.headers["authorization"];
  if (authJWT === undefined) {
    response.sendStatus(400).send("Token saknas.");
    return;
  }

  let token = authJWT.slice(7);

  // decrypt and compare user-token with jwt_secret
  let decrypt;
  try {
    decrypt = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log(err);
    response.status(401).send("Ogiltigt Token!");
    return;
  }
  // if token is correct, run this code!

  if (!request.params && !request.params.id) {
    return response.status(400).send("Ogiltig förfrågan");
  }
  const commentID = request.params.id;
  const { name, message } = request.body;

  if (!name && !message) {
    return response.status(400).send("Fyll i all fält!");
  } else if (!name) {
    return response.status(400).send("Fyll i namn!");
  } else if (!message) {
    return response.status(400).send("Fyll i meddelande!");
  } else {
    const sqlDB = "UPDATE comments SET name = ?, message = ? WHERE id = ? ";
    const values = [name, message, commentID];

    connectDB.query(sqlDB, values, function (err, result, fields) {
      if (err) {
        console.log("Error with query", err);
        response.status(500).send("Server Error");
      } else {
        response.send("Meddelande har uppdaterats!");
      }
    });
  }
});

/*
============================
DELETE (REQ JWT)
============================
*/

//Delete users thru /deleteUser/ID (REQ JWT)
app.delete("/deleteUser/:id", function (request, response) {
  // Require JWT and decode
  let authJWT = request.headers["authorization"];
  if (authJWT === undefined) {
    response.sendStatus(400).send("Token saknas.");
    return;
  }

  let token = authJWT.slice(7);

  // decrypt and compare user-token with jwt_secret
  let decrypt;
  try {
    decrypt = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log(err);
    response.status(401).send("Ogiltigt Token!");
    return;
  }
  // if token is correct, run this code!
  const userID = request.params.id;

  if (!userID) {
    return response.status(400).send("Ogiltig förfrågan!");
  }
  const sqlDB = "DELETE FROM register WHERE id = ? ";
  const value = [userID];

  connectDB.query(sqlDB, value, function (err, result, fields) {
    if (err) {
      console.error("Error with query", err);
      response.status(500).send("Server Error");
    } else {
      response.status(202).send("Användare är borttagen ur databasen."); // 202 STATUS ACCEPTED
    }
  });
});

//Delete comment thru /deleteComment/ID (REQ JWT)
app.delete("/deleteComment/:id", function (request, response) {
  // Require JWT and decode
  let authJWT = request.headers["authorization"];
  if (authJWT === undefined) {
    response.sendStatus(400).send("Token saknas.");
    return;
  }

  let token = authJWT.slice(7);

  // decrypt and compare user-token with jwt_secret
  let decrypt;
  try {
    decrypt = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log(err);
    response.status(401).send("Ogiltigt Token!");
    return;
  }
  // if token is correct, run this code!
  const commentID = request.params.id;

  if (!commentID) {
    return response.status(400).send("Ogiltig förfrågan!");
  }
  const sqlDB = "DELETE FROM comments WHERE id = ? ";
  const value = [commentID];

  connectDB.query(sqlDB, value, function (err, result, fields) {
    if (err) {
      console.error("Error with query", err);
      response.status(500).send("Server Error");
    } else {
      response.status(202).send("Gästboksinlägg är borttaget ur databasen."); // 202 STATUS ACCEPTED
    }
  });
});

/*
============================
Login with POST (GIVES JWT)
============================
*/

app.post("/login", function (request, response) {
  const username = request.body.username;
  const password = request.body.password;

  if (!username && !password) {
    response.status(401).send("Fyll i alla uppgifter för att logga in!");
  }

  const compareHash = cryptohash(password);
  const sqlDB = "SELECT * FROM register WHERE username = ? AND password = ?";
  const values = [username, compareHash];

  connectDB.query(sqlDB, values, function (err, result, fields) {
    if (err) {
      console.error("Error with query", err);
      response.send(500).send("Server Error");
    } else {
      if (result.length > 0) {
        // get user session info and display after login
        const userInfo = {
          id: result[0].id,
          name: result[0].name,
          sub: result[0].username,
          email: result[0].email,
        };
        //create jwt for user
        const token = jwt.sign(userInfo, process.env.JWT_SECRET, {
          expiresIn: "2h",
        });
        // 200 STATUS OK FOR LOGIN SUCCESS, 401 STATUS FOR FAILED LOGIN ATTEMPT
        response.status(200).json({
          message: "Inloggning är godkänd.",
          user: userInfo,
          token: token,
        });
        console.log("Your Session Token: " + token);
      } else {
        response.status(401).send("Inloggning misslyckades.");
      }
    }
  });
});
