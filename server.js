const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");  // For password hashing
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");  // For UUID generation
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
const cors = require("cors");
app.use(cors({
  origin: "http://localhost:5173"  // Adjust to your frontend's URL
}));


// Load environment variables
// const DB_USERNAME = process.env.DATABASE_USERNAME;
// const DB_PASSWORD = process.env.DATABASE_PASSWORD;

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/chatbotdb")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error", err));


// Define User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  hashed_password: { type: String, required: true },
});

// Define Query Schema
const querySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  query_text: { type: String, required: true },
  query_type: { type: String },
  timestamp: { type: Date, default: Date.now },
  session_id: { type: String, required: true },
  device_type: { type: String },
  location: { type: String },
  intent_detected: { type: String },
});

// Define Mongoose models
const User = mongoose.model("User", userSchema);
const Query = mongoose.model("Query", querySchema);

// Helper function for hashing passwords
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Create a new user
app.post("/users", async (req, res) => {
  try {
    // Hash the password
    const hashed_password = await hashPassword(req.body.password);

    // Create and save the new user
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      hashed_password,
    });
    await user.save();
    res.status(201).send({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Fetch all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).send(users);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Create a query for a user
app.post("/queries", async (req, res) => {
  try {
    const query = new Query({
      ...req.body,
      timestamp: new Date(),  // Set timestamp to current time
    });

    await query.save();
    res.status(201).send(query);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Get all queries for a user
app.get("/queries/:user_id", async (req, res) => {
  try {
    // Assuming you want to find queries by user_id, not a single query by id
    const queries = await Query.find({ user_id: req.params.user_id });
    if (!queries || queries.length === 0) {
      return res.status(404).send("No queries found for this user");
    }
    res.status(200).send(queries);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// Get all queries for a session
app.get("/conversations/:sessionId", async (req, res) => {
  try {
    const conversation = await Query.find({ session_id: req.params.sessionId });
    if (!conversation.length) {
      return res.status(404).send({ message: "Conversation not found" });
    }
    res.status(200).send(conversation);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete a conversation by session ID
app.delete("/conversations/:sessionId", async (req, res) => {
  try {
    const conversation = await Query.find({ session_id: req.params.sessionId });
    if (!conversation.length) {
      return res.status(404).send({ message: "Conversation not found" });
    }

    await Query.deleteMany({ session_id: req.params.sessionId });
    res.status(200).send({ message: "Conversation deleted successfully" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Server configuration
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
