const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const contactManager = require("./lib/contact-service");
const PgService = require("./lib/pg-service");
const helpers = require("./utils/helpers");
const jwt = require("jsonwebtoken");
const { PORT } = require("./utils/config");
const app = express();

app.set("port", process.env.PORT || PORT);

app.use("/", express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const contactsAPI = express.Router();
app.use("/api/contacts", contactsAPI);

contactsAPI.use((req, res, next) => {
  const token = helpers.getTokenFrom(req);

  if (!token) {
    res.status(401).send({ error: "Error: Credentials invalid" });
  }

  const decoded = jwt.verify(token, process.env.SECRET);
  if (!decoded) {
    res.status(401).send({ error: "Error: Credentials invalid" });
  }

  req.username = decoded.username;
  next();
});

contactsAPI.get("/", async (req, res) => {
  try {
    let contacts = await contactManager.getAll();
    contacts = contacts.filter(({ username }) => username === req.username);
    res.status(200).json(contacts);
  } catch (error) {
    console.error(error);
  }
});

contactsAPI.get("/:id", async (req, res) => {
  try {
    const contact = await contactManager.get(req.params.id);
    if (contact) {
      res.json(contact);
    } else {
      res.status(404).end();
    }
  } catch (error) {
    console.error(error);
  }
});

contactsAPI.post("/", async (req, res) => {
  try {
    const contactAttrs = helpers.extractContactAttrs(req.body);
    const contact = await contactManager.add(contactAttrs);

    if (contact) {
      res.status(201).json(contact);
    } else {
      res.status(400).end();
    }
  } catch (error) {
    console.error(error);
  }
});

app.post("/login", async (req, res) => {
  const postgres = new PgService();
  const { username, password } = req.body;
  const authenticated = await postgres.auth(username, password);

  if (!authenticated) {
    return res.status(401).send({ error: "Could not authenticate user" });
  }

  const tokenConfig = { username };

  const token = jwt.sign(tokenConfig, process.env.SECRET, {
    expiresIn: 60 * 60 * 24,
  });

  return res.status(200).send({ token, username });
});

contactsAPI.put("/:id", async (req, res) => {
  try {
    let contactAttrs = helpers.extractContactAttrs(req.body);
    let contact = await contactManager.update(req.params["id"], contactAttrs);
    if (contact) {
      res.status(201).json(contact);
    } else {
      res.status(400).end();
    }
  } catch (error) {
    console.error(error);
  }
});

contactsAPI.delete("/:id", async (req, res) => {
  try {
    const removed = await contactManager.remove(req.params["id"]);
    if (removed) {
      res.status(204).end();
    } else {
      res.status(400).end();
    }
  } catch (error) {
    console.error(error);
  }
});

app.listen(app.get("port"), () => {
  console.log(`Find the server at: http://localhost:${app.get("port")}/`); // eslint-disable-line no-console
});

module.exports = app; // for testing
