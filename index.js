// ** imports
const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 8000;
require("dotenv").config();
const jwt = require("jsonwebtoken");

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

// ** DB COLLECTIONS

const homeCollection = client.db("airbnb-clone").collection("homes");
const userCollection = client.db("airbnb-clone").collection("users");

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
      message: "User created successfully",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// ** generate jwt

app.post("/jwt", async (req, res) => {
  try {
    const payload = req.body;
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

// ** APIS

// ** App listen
app.listen(port, () => console.log(`Server is running on port ${port}`));
