const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const contactManager = require("./lib/contact_manager");
const PgService = require("./lib/pg-service");
const helpers = require("./lib/helpers");
const { use } = require("chai");

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

app.set("port", process.env.PORT || 3000);

app.use("/", express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/contacts", (_, res) => {
  res.json(contactManager.getAll());
});

app.get("/api/contacts/:id", (req, res) => {
  let contact = contactManager.get(req.params["id"]);
  if (contact) {
    res.json(contact);
  } else {
    res.status(404).end();
  }
});

app.post("/api/contacts", (req, res) => {
  let contactAttrs = helpers.extractContactAttrs(req.body);
  let contact = contactManager.add(contactAttrs);
  if (contact) {
    res.status(201).json(contact);
  } else {
    res.status(400).end();
  }
});

app.post("/api/login", async (req, res) => {
  const postgres = new PgService();
  let { username, password } = req.body;
  let authenticated = await postgres.authenticate(username, password);

  if (!authenticated) {
    return res.send({ error: "Could not authenticate user" });
  }

  return res.status(200).send({
    currentUser: username,
  });
});

app.put("/api/contacts/:id", (req, res) => {
  let contactAttrs = helpers.extractContactAttrs(req.body);
  let contact = contactManager.update(req.params["id"], contactAttrs);
  if (contact) {
    res.status(201).json(contact);
  } else {
    res.status(400).end();
  }
});

app.delete("/api/contacts/:id", (req, res) => {
  if (contactManager.remove(req.params["id"])) {
    res.status(204).end();
  } else {
    res.status(400).end();
  }
});

app.listen(app.get("port"), () => {
  console.log(`Find the server at: http://localhost:${app.get("port")}/`); // eslint-disable-line no-console
});

module.exports = app; // for testing
