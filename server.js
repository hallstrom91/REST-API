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
const { request } = require("http");

const app = express();
const port = process.env.PORT || 3000;

/*
============================
SQL Database 
============================
*/

dotenv.config({ path: path.resolve(__dirname, ".env") });

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

//Log every incoming session
app.use((request, response, next) => {
  console.log(
    `[${new Date().toLocaleString()}] [USER-IP ${request.ip}] ${
      request.method
    } ${request.url} `
  );
  next();
});

// JWT Auth
function authToken(request, response, next) {
  const token = req.header("Auth");
  if (!token) return response.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return response.sendStatus(403);
    request.user = user;
    next();
  });
}

/*
============================
HTML Display
============================
*/

// CSS and client side JS
app.use(express.static(path.join(__dirname, "static")));

// HTML
app.get("/", (request, response) => {
  response.sendFile(path.join(__dirname + "/index.html"));
});

/*
============================
GET
============================
*/

app.get("/register", function (request, response) {
  let sqlDB = "SELECT * FROM register";
  let parameters = [];

  if (request.query.id) {
    sqlDB += " WHERE id = ?";
    parameters.push(request.query.id);
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

app.get("/comments", function (request, response) {
  let sqlDB = "SELECT * FROM comments";
  let parameters = [];

  if (request.query.id) {
    sqlDB += " WHERE id = ?";
    parameters.push(request.query.id);
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

app.post("/register", function (request, response) {
  const { name, username, password, email } = request.body;

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
    const sqlDB =
      "INSERT INTO register (name, username, password, email) VALUES (?, ?, ?, ?)";
    const values = [name, username, password, email];

    connectDB.query(sqlDB, values, function (err, result, fields) {
      if (err) {
        console.error("Error with query", err);
        response.status(500).send("Server Error");
      } else {
        response.send("En ny användare är inlagd i databasen!");
      }
    });
  }
});

/*
============================
PUT
============================
*/

/*
============================
DELETE
============================
*/
