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
const app = express();
const port = process.env.PORT;

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
    console.log("Database connected sucessfully!");
  }
});

/*
============================
To be continued
============================
*/
