const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

const users = [
  { username: "admin1", password: "admin123", role: "admin" },
  { username: "teacher1", password: "teacher123", role: "teacher" },
  { username: "student1", password: "student123", role: "student" },
];

const createUsers = async () => {
  try {
    for (let u of users) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      const user = new User({ username: u.username, password: hashedPassword, role: u.role });
      await user.save();
      console.log(`User ${u.username} created`);
    }
    console.log("All users created successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
};

createUsers();
