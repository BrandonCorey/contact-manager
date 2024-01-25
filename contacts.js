const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const contactManager = require("./lib/contact-service");
const PgService = require("./lib/pg-service");
const helpers = require("./utils/helpers");
const jwt = require("jsonwebtoken");
const { PORT } = require("./utils/config");
const app = express();

// app.use((req, res, next) => {
//   const authorization = req.header("authorization");
//   if (!(authorization && authorization.startsWith("Bearer "))) {
//     res.send({
//       currentUser: "",
//     });
//   }
//
//   next();
// });

app.set("port", process.env.PORT || PORT);

app.use("/", express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/contacts", async (_, res) => {
  try {
    const contacts = await contactManager.getAll();
    res.status(200).json(contacts);
  } catch (error) {
    console.error(error);
  }
});

app.get("/api/contacts/:id", async (req, res) => {
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

app.post("/api/contacts", async (req, res) => {
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

app.post("/api/login", async (req, res) => {
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

  return res.status(200).send({ username, token });
});

app.put("/api/contacts/:id", async (req, res) => {
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

app.delete("/api/contacts/:id", async (req, res) => {
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
