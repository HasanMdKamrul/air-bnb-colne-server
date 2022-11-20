// ** imports
const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 8000;
require("dotenv").config();

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

// ** APIS

// ** App listen
app.listen(port, () => console.log(`Server is running on port ${port}`));
