const express = require("express");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5020;
const cors = require("cors");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

app.use(express.json());
// cors issue fixed
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5020",
  "http://localhost:5174",
]; // frontend URL
app.use(
  cors({
    origin: allowedOrigins, // trailing slash নেই
    credentials: true,
    // ✅ session cookie
  }),
);

// cors issue fixed
const MongoStore = require("connect-mongo").default;
// console.log("MongoStore Type:", typeof MongoStore.create);
/* =======================
   SESSION + PASSPORT SETUP
======================= */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mySecretKey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.pppehle.mongodb.net/ServiceDatabase?retryWrites=true&w=majority`,
      collectionName: "sessions",
      ttl: 24 * 60 * 60, // ১ দিন (সেকেন্ডে)
      autoRemove: "native", // এক্সপায়ার হওয়া সেশন নিজে থেকেই ডিলিট হবে
    }),
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

/* =======================
   MONGODB CONNECTION
======================= */
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.pppehle.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});



app.get(
      "/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] }),
    );

async function run() {
  try {
    const db = client.db("ServiceDatabase");

    // 🔹 collections
    const usersCollection = db.collection("users");
    const userSendData = db.collection("Serviceitem");
    const requestedServiceSendData = db.collection("Requestedtitem");

    /* =======================
       PASSPORT LOCAL STRATEGY
    ======================= */
    passport.use(
      new LocalStrategy(
        { usernameField: "email" },
        async (email, password, done) => {
          try {
            const user = await usersCollection.findOne({ email });
            if (!user) return done(null, false);

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return done(null, false);

            return done(null, user);
          } catch (err) {
            done(err);
          }
        },
      ),
    );
    // google strategy

   passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "http://localhost:5020/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // 1️⃣ Check if Google user exists
            let user = await usersCollection.findOne({ googleId: profile.id });

            if (!user) {
              // 2️⃣ Check if same email exists for local account
              const existingEmailUser = await usersCollection.findOne({ email: profile.emails[0].value });

              if (existingEmailUser) {
                // Optionally, link account
                await usersCollection.updateOne(
                  { _id: existingEmailUser._id },
                  { $set: { googleId: profile.id } }
                );
                user = await usersCollection.findOne({ _id: existingEmailUser._id });
              } else {
                // 3️⃣ Create new Google user
                const newUser = {
                  googleId: profile.id,
                  name: profile.displayName,
                  email: profile.emails[0].value,
                  photo: profile.photos[0].value,
                  provider: "google",
                  createdAt: new Date(),
                };
                await usersCollection.insertOne(newUser);
                user = newUser;
              }
            }

            done(null, user);
          } catch (err) {
            done(err);
          }
        }
      )
    );
    // Start Google login
    

    // Google callback URL
    app.get(
      "/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login" }),
      (req, res) => {
        // Successful login, redirect frontend
        res.redirect("http://localhost:5173"); // বা React app homepage
      },
    );

    // google strategy

    passport.serializeUser((user, done) => {
      done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
      const user = await usersCollection.findOne({ _id: new ObjectId(id) });
      done(null, user);
    });

    /* =======================
       AUTH ROUTES (NEW)
    ======================= */
    const isAuthenticated = (req, res, next) => {
      if (req.isAuthenticated()) {
        return next(); // logged in → next route
      }
      res.status(401).send({ message: "Unauthorized" }); // not logged in
    };

    // REGISTER
    // app.post("/register", async (req, res) => {
    //   const { name, email, password } = req.body;

    //   const existingUser = await usersCollection.findOne({ email });
    //   if (existingUser) {
    //     return res.status(400).send({ message: "User already exists" });
    //   }

    //   const hashedPassword = await bcrypt.hash(password, 10);

    //   await usersCollection.insertOne({
    //     name,
    //     email,
    //     password: hashedPassword,
    //     provider: "local",
    //     createdAt: new Date(),
    //   });

    //   res.send({ message: "Registration successful" });
    // });

    app.post("/register", async (req, res) => {
      try {
        const { name, email, password, photo } = req.body;

        // Check existing user
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
          return res.status(400).send({ message: "User already exists" });
        }

        if (existingUser) {
          // যদি provider "google" হয় → Google user already exists
          if (existingUser.provider === "google") {
            return res.status(400).send({
              message:
                "This email is already registered via Google. Please login with Google.",
            });
          }

          // Local user already exists
          return res.status(400).send({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user with photo
        await usersCollection.insertOne({
          name,
          email,
          password: hashedPassword,
          photo, // store image URL
          provider: "local",
          createdAt: new Date(),
        });

        res.send({ message: "Registration successful" });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // LOGIN
    app.post("/login", passport.authenticate("local"), (req, res) => {
      const { password, ...userWithoutPassword } = req.user;

      res.send({
        message: "Login successful",
        user: userWithoutPassword,
      });
    });

    // LOGOUT
    app.post("/logout", (req, res) => {
      req.logout((err) => {
        if (err) {
          return res.status(500).send({ message: "Logout error" });
        }

        req.session.destroy(() => {
          res.clearCookie("connect.sid", {
            path: "/", // 🔴 must match
            httpOnly: true,
            sameSite: "lax",
          });

          res.send({ message: "Logged out successfully" });
        });
      });
    });

    // PROTECTED TEST
    app.get("/me", (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const { password, ...userWithoutPassword } = req.user;

      res.send(userWithoutPassword);
    });

    /* =======================
       YOUR EXISTING APIs (UNCHANGED)
    ======================= */

    app.get("/usersenddata", async (req, res) => {
      const result = await userSendData.find().toArray();
      res.send(result);
    });

    app.get("/adminsenddata", async (req, res) => {
      const result = await userSendData.find().toArray();
      res.send(result);
    });

    app.get("/usersenddata/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await userSendData.findOne(query);
      res.send(result);
    });

    app.get("/usersendcollection", async (req, res) => {
      let querys = {};
      if (req.query?.email) {
        querys = { useremail: req.query.email };
      }
      const result = await userSendData.find(querys).toArray();
      res.send(result);
    });

    app.get("/requestsendcollection", async (req, res) => {
      let querys = {};
      if (req.query?.Usersemail) {
        querys = { Usersemail: req.query.Usersemail };
      }
      const result = await requestedServiceSendData.find(querys).toArray();
      res.send(result);
    });

    app.put("/usersenddata/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const update = {
        $set: {
          ServiceArea: req.body.ServiceArea,
          price: req.body.price,
          description: req.body.description,
          ServiceImage: req.body.ServiceImage,
          ServiceName: req.body.ServiceName,
        },
      };
      const result = await userSendData.updateOne(filter, update, {
        upsert: true,
      });
      res.send(result);
    });

    app.post("/usersenddata", async (req, res) => {
      const result = await userSendData.insertOne(req.body);
      res.send(result);
    });

    app.post("/requestsend", async (req, res) => {
      const result = await requestedServiceSendData.insertOne(req.body);
      res.send(result);
    });

    app.delete("/usersenddata/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await userSendData.deleteOne(query);
      res.send(result);
    });

    console.log("✅ MongoDB Connected & Passport Ready");
  } finally {
  }
}

run().catch(console.dir);

/* =======================
   ROOT & SERVER
======================= */
app.get("/", (req, res) => {
  res.send("my assignment 11 has been starteds");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
