const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

const { Redis } = require("@upstash/redis");
const redis = new Redis({
  url: "https://mint-reptile-37466.upstash.io",
  token: process.env.REDIS_TOKEN
});

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Firebase
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  try {
    serviceAccount = require("./serviceAccountKey.json");
  } catch (error) {
    console.error("Error: Could not find Firebase credentials.");
    console.error("Please ensure serviceAccountKey.json exists locally, or FIREBASE_SERVICE_ACCOUNT is set in your environment.");
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Auth middleware
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).send("No token");

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
};

// Test routes
app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/todos", (req, res) => {
  res.json([
    { id: 1, text: "Learn React" },
    { id: 2, text: "Learn Backend" }
  ]);
});

// Redis Indexing (Gmails)

// 1. Sync User Email to Redis
app.post("/api/users/sync", async (req, res) => {
  try {
    const { email, uid } = req.body;
    if (!email || !uid) return res.status(400).json({ error: "Missing email or uid" });

    // Key-Value Lookup (Exact match: email -> uid)
    await redis.set(`user:email:${email}`, uid);

    // Sorted Set for Autocomplete (Store email lexicographically)
    await redis.zadd("users:emails:autocomplete", { score: 0, member: email });

    res.json({ success: true });
  } catch (err) {
    console.error("Redis sync error:", err);
    res.status(500).json({ error: err.message || "Failed to sync to Redis" });
  }
});

// 2. Search Emails (Autocomplete)
app.get("/api/users/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);

    // Search for emails starting with the query using ZRANGEBYLEX
    const results = await redis.sendCommand([
      "ZRANGEBYLEX", 
      "users:emails:autocomplete", 
      `[${query}`, 
      `[${query}\xff`, 
      "LIMIT", 
      0, 
      10
    ]);

    res.json(results);
  } catch (err) {
    console.error("Redis search error:", err);
    res.status(500).json({ error: "Failed to search" });
  }
});

// 3. Lookup UID by Exact Email
app.get("/api/users/lookup", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing email" });

    const uid = await redis.get(`user:email:${email}`);
    if (!uid) return res.json({ exists: false });

    res.json({ exists: true, uid });
  } catch (err) {
    res.status(500).json({ error: "Failed to lookup" });
  }
});

// Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order
app.post("/create-order", async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: 50000,
      currency: "INR",
      receipt: "receipt#1",
    });

    res.json(order);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Verify Payment
app.post("/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});

// START SERVER (ONLY ONCE)
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});