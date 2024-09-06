const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const app = express();
app.use(bodyParser.json());
const DB_USERNAME = process.env.DATABASE_USERNAME;
const DB_PASSWORD = process.env.DATABASE_PASSWORD;

mongoose
  .connect(
    `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.x3csb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(console.log("Connected to Mongo"));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

const querySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  query_text: { type: String, required: true },
  query_type: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  session_id: { type: String, required: true },
  device_type: { type: String, required: true },
  location: { type: String },
  intent_detected: { type: String, required: true },
});

const Query = mongoose.model("Query", querySchema);

app.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).send(users);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/queries", async (req, res) => {
  try {
    const query = new Query(req.body);
    await query.save();
    res.status(201).send(query);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.get("/users/:userId/queries", async (req, res) => {
  try {
    const queries = await Query.find({ user_id: req.params.userId });
    res.status(200).send(queries);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
