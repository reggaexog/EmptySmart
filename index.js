const express = require("express");
const { engine } = require("express-handlebars");
const { PrismaClient } = require("@prisma/client");
const session = require("express-session");

const app = express();
const port = process.env.PORT || 3000;
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "my-secret", // a secret string used to sign the session ID cookie
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
  })
);

const db = new PrismaClient();

app.get("/", (req, res) => {
  res.render("home");
});

//BEJELENTKEZÉS
app.get("/bejelentkezes", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/map");
  }
  res.render("bejelentkezes");
});

app.post("/bejelentkezes", async (req, res) => {
  if (req.session.userId) {
    return res.redirect("/map");
  }
  const { felhasznalonev, jelszo } = req.body;
  const user = await db.felhasznalo.findUnique({
    where: {
      felhasznalonev: felhasznalonev,
    },
  });
  if (!user || user.jelszo !== jelszo) {
    return res.render("bejelentkezes", {
      error: "Hibás felhasználónév vagy jelszó!",
    });
  }
  req.session.userId = user.id;
  res.redirect("/map");
});

//REGISZTRÁCIÓ
app.get("/regisztracio", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/map");
  }
  res.render("regisztracio");
});

app.post("/regisztracio", async (req, res) => {
  if (req.session.userId) {
    return res.redirect("/map");
  }
  const { felhasznalonev, jelszo, jelszo_ismet } = req.body;
  if (jelszo !== jelszo_ismet) {
    return res.render("regisztracio", {
      error: "A két jelszó nem egyezik!",
    });
  }

  const existingUser = await db.felhasznalo.findUnique({
    where: {
      felhasznalonev,
    },
  });

  if (existingUser) {
    return res.render("regisztracio", {
      error: "A felhasználónév már foglalt!",
    });
  }

  const newUser = await db.felhasznalo.create({
    data: {
      felhasznalonev,
      jelszo,
    },
  });
  req.session.userId = newUser.id;
  res.redirect("/map");
});

//ADMIN BEJELENTKEZÉS
app.post("/adminbejelentkezes", async (req, res) => {
  if (req.session.adminId) {
    return res.redirect("/adminmap");
  }
  const { felhasznalonev, jelszo } = req.body;
  const admin = await db.kukas.findUnique({
    where: {
      felhasznalonev,
    },
  });
  if (!admin || admin.jelszo !== jelszo) {
    return res.render("adminbejelentkezes", {
      error: "Hibás felhasználónév vagy jelszó!",
    });
  }
  req.session.adminId = admin.id;
  res.redirect("/adminmap");
});

app.get("/adminbejelentkezes", (req, res) => {
  if (req.session.adminId) {
    return res.redirect("/adminmap");
  }
  res.render("adminbejelentkezes");
});

app.get("/adminmap", (req, res) => {
  if (!req.session.adminId) {
    return res.redirect("/adminbejelentkezes");
  }
  res.render("adminmap");
});

app.get("/kuka/:id/urites", async (req, res) => {
  if (!req.session.adminId) {
    return res.redirect("/adminbejelentkezes");
  }
  const { id } = req.params;
  const kuka = await db.kuka.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  res.render("urites", { kuka });
});

app.post("/kuka/:id/urites", async (req, res) => {
  if (!req.session.adminId) {
    return res.redirect("/adminbejelentkezes");
  }
  const { id } = req.params;
  const kuka = await db.kuka.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  await db.kuka.update({
    where: {
      id: parseInt(id),
    },
    data: {
      allapot: 0,
      legutobbi_urites: new Date(),
    },
  });
  res.redirect("/map");
});

app.get("/kuka/:id/szerkesztes", async (req, res) => {
  if (!req.session.adminId) {
    return res.redirect("/adminbejelentkezes");
  }
  const { id } = req.params;
  const kuka = await db.kuka.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  res.render("szerkesztes", { kuka });
});

app.post("/kuka/:id/szerkesztes", async (req, res) => {
  if (!req.session.adminId) {
    return res.redirect("/adminbejelentkezes");
  }
  const { id } = req.params;
  const { location_x, location_y } = req.body;
  await db.kuka.update({
    where: {
      id: parseInt(id),
    },
    data: {
      location_x,
      location_y,
    },
  });
  res.redirect("/map");
});

app.get("/kuka/:id/torles", async (req, res) => {
  if (!req.session.adminId) {
    return res.redirect("/adminbejelentkezes");
  }
  const { id } = req.params;
  await db.kuka.delete({
    where: {
      id: parseInt(id),
    },
  });
  res.redirect("/map");
});

app.post("/uj-kuka", async (req, res) => {
  if (!req.session.adminId) {
    return res.redirect("/adminbejelentkezes");
  }
  const { location_x, location_y } = req.body;
  const newKuka = await db.kuka.create({
    data: {
      location_x,
      location_y,
      allapot: 0,
      legutobbi_urites: null,
    },
  });
  res.redirect("/map");
});

app.get("/map", async (req, res) => {
  const kukak = await db.kuka.findMany();
  res.render("map", { kukak });
});
app.get("/kilepes", (req, res) => {
  req.session.userId = null;
  req.session.adminId = null;
  res.redirect("/");
});


app.listen(port, () => {
  console.log("A szerver elindult.");
});
