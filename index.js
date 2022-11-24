// ** imports
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 8000;
require("dotenv").config();
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(
  "sk_test_51LxTnqIl1BLL3CgooM3f9SzR1QNRwZlqwPo06ejXXoflFWArP1AhGgpvFuO6laGPiwu64yv9terlAuAYynGZ7Du000qm0MGGpM"
);

// ** Middlewares
app.use(cors());
// ** To convert the data comming from client into the json format
app.use(express.json());

// ** Test Api end point
app.get("/", (req, res) => res.send(`Server is running fine....`));

// ** DB CONNECTION

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7ikallh.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();
    console.log("DB CONNECTED");
  } catch (error) {
    console.log(error.message);
  }
};

run();

// ** generate jwt

app.get("/jwt", async (req, res) => {
  try {
    const email = req.query.email;

    const payload = {
      email: email,
    };

    const filter = {
      email: email,
    };

    const userExisted = await userCollection.findOne(filter);

    if (!userExisted) {
      return res.status(401).send({
        success: false,
        message: `Unauthorised acccess`,
      });
    }

    const token = jwt.sign(payload, process.env.ACCESS_SECRET_TOKEN);

    return res.send({
      success: true,
      token,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// ** verifyJWT -middleware

const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({
      success: false,
      message: "Unauthorised access",
    });
  }

  // ** verify token
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        success: false,
        message: "Unauthorised access",
      });
    } else {
      req.decoded = decoded;
      next();
    }
  });
};

// ** Verify Admin

const verifyAdmin = async (req, res, next) => {
  const emailDecoded = req.decoded.email;

  console.log(emailDecoded);

  if (!emailDecoded) {
    return res.status(401).send({
      success: false,
      message: "unauthorised access",
    });
  }

  const filter = {
    email: emailDecoded,
  };

  const isAdmin = await userCollection.findOne(filter);
  console.log(isAdmin);

  if (isAdmin.role !== "admin") {
    return res.status(401).send({
      success: false,
      message: "Unauthorised access",
    });
  }

  next();
};

// ** DB COLLECTIONS

const homeCollection = client.db("airbnb-clone").collection("homes");
const userCollection = client.db("airbnb-clone").collection("users");
const bookingCollection = client.db("airbnb-clone").collection("bookings");
const paymentCollection = client.db("airbnb-clone").collection("payments");

// ** Handle Payment

app.post("/create-payment-intent", async (req, res) => {
  const booking = req.body;
  console.log(booking);
  const price = booking.price;
  console.log(price);
  const amount = price * 100;

  const paymentIntent = await stripe.paymentIntents.create({
    currency: "usd",
    amount: amount,
    payment_method_types: ["card"],
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

// ** Creating users
app.put("/users", async (req, res) => {
  try {
    const userData = req.body;
    const email = userData.email;
    const filter = {
      email: email,
    };
    const updatedDoc = {
      $set: userData,
    };

    const options = { upsert: true };

    const user = await userCollection.updateOne(filter, updatedDoc, options);
    return res.send({
      success: true,
      data: user,
      message: "User created/Updated successfully",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// ** Get a single user role + get all users

app.get("/users", async (req, res) => {
  try {
    const email = req.query.email;

    if (email) {
      const filter = {
        email: email,
      };
      const userRole = await userCollection.findOne(filter, {
        projection: { role: 1 },
      });

      return res.send({
        success: true,
        data: userRole,
      });
    } else {
      // ** get all users
      const filter = {};
      const users = await userCollection.find(filter).toArray();

      return res.send({
        success: true,
        data: users,
      });
    }
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// ** User role update to host

app.patch("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const filter = {
      _id: ObjectId(id),
    };

    const userData = req.body;

    console.log(userData.role);

    const updatedDoc = {
      $set: {
        role: userData?.role,
      },
    };

    const updatedUser = await userCollection.updateOne(filter, updatedDoc);

    return res.send({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// ** Save booking collection to DB

app.post("/bookings", async (req, res) => {
  try {
    const bookingData = req.body;
    const bookingSaved = await bookingCollection.insertOne(bookingData);

    return res.send({
      success: true,
      data: bookingSaved,
      message: "Booking data saved to DB",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// ** get all the bookings

app.get("/bookings", async (req, res) => {
  try {
    const email = req.query.email;
    let filter = {};
    if (email) {
      filter = {
        guestEmail: email,
      };
    }

    const bookings = await bookingCollection.find(filter).toArray();

    return res.send({
      success: true,
      data: bookings,
      message: `Bookings data fetched`,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// ** get all bookings as admin

app.get("/allbookings", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const email = req.query.email;
    console.log(email);
    const emailDecoded = req.decoded.email;

    console.log(emailDecoded);

    if (email !== emailDecoded) {
      return res.status(401).send({
        success: false,
        message: "Unauthorised access",
      });
    }

    const filter = {};
    const bookings = await bookingCollection.find(filter).toArray();

    return res.send({
      success: true,
      data: bookings,
      message: `Bookings data fetched`,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// ** Save Home data

app.post("/homes", verifyJWT, async (req, res) => {
  try {
    console.log(req.decoded.email);

    const email = req.decoded.email;

    const homeData = req.body;

    if (email !== homeData.host.hostEmail) {
      return res.status(403).send({
        success: false,
        message: "Unauthorised access",
      });
    }

    const result = await homeCollection.insertOne(homeData);
    return res.send({
      success: true,
      data: result,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

app.post("/payments", async (req, res) => {
  try {
    const payment = req.body;
    const result = await paymentCollection.insertOne(payment);
    res.send({
      success: true,
      data: result,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// ** APIS

// ** App listen
app.listen(port, () => console.log(`Server is running on port ${port}`));
