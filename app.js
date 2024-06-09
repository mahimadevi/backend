require("dotenv").config();
const express = require("express");
const app = express();
const connect = require('../server/db/conn')
const mongoose = require("mongoose");
const products = require("./models/productSchema");
const DefaultData = require("./defaultdata");
const cors = require("cors");
const router = require("./routes/router");
const cookieParser = require("cookie-parser")
const jwt = require("jsonwebtoken");


const port = process.env.PORT || 3005;

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173', // Allow only this origin to connect
  credentials: true,
  origin:true // Allow credentials (cookies, session, etc.)
};

app.use(express.json());
app.use(cookieParser(""));
app.use(cors(corsOptions));
// app.use(cors());
app.use(router);
//for deployment
if(process.env.NODE_ENV === "production"){
  app.use(express.static("client/build"))
}


app.listen(port, () => {
  console.log(`server is running on port number ${port}`);
  connect();
});


DefaultData();