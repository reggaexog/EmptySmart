const express = require("express");
const { engine } = require("express-handlebars");
const { PrismaClient } = require("@prisma/client");
const session = require("express-session");
const { Prisma } = require("@prisma/client");

const app = express();
const port = process.env.PORT || 3000;
app.engine(
  ".hbs",
  engine({
    extname: ".hbs",
    helpers: {
      json: function (context) {
        return JSON.stringify(context, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        );
      },
      HOST: function () {
        return process.env.HOST || "http://localhost:3000";
      },
    },
  })
);
app.set("view engine", ".hbs");
app.set("views", "./views");
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "my-secret", // a secret string used to sign the session ID cookie
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
  })
);
app.use(express.static("public"));
app.use(express.json());

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

app.get("/adminmap", async (req, res) => {
  if (!req.session.adminId) {
    return res.redirect("/adminbejelentkezes");
  }

  const kukak =
    await db.$queryRaw`SELECT k.*, COUNT(j.id) AS jelzesek_count FROM Kuka k LEFT JOIN Jelzesek j ON j.kukaId = k.id AND j.jelzes_datum > k.legutobbi_urites GROUP BY k.id;`;
  res.render("adminmap", {
    kukak,
  });
});
app.post("/kuka/:id/urites", async (req, res) => {
  if (!req.session.adminId) {
    return res.json({ error: "Nincs jogosultság" });
  }
  const { id } = req.params;

  await db.kukaUritesek.create({
    data: {
      kukaId: parseInt(id),
      kukasId: req.session.adminId,
      kiurites_datum: new Date(),
    },
  });

  const kuka = await db.kuka.update({
    where: {
      id: parseInt(id),
    },
    data: {
      allapot: 0,
      legutobbi_urites: new Date(),
    },
  });
  res.json({
    success: true,
  });
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
    return res.json({ error: "Nincs jogosultság" });
  }
  const { id } = req.params;
  const { location_x, location_y } = req.body;
  await db.kuka.update({
    where: {
      id: parseInt(id),
    },
    data: {
      location_x: location_x.toString(),
      location_y: location_y.toString(),
    },
  });
  res.json({ success: true });
});

app.post("/kuka/:id/torles", async (req, res) => {
  if (!req.session.adminId) {
    return res.json({ error: "Nincs jogosultság" });
  }
  const { id } = req.params;
  await db.kuka.delete({
    where: {
      id: parseInt(id),
    },
  });
  res.json({ success: true });
});
app.post("/kuka/:id/jelzes", async (req, res) => {
  if (!req.session.userId) {
    return res.json({ error: "Jelentkezz be kérlek!" });
  }
  const { id } = req.params;

  const result =
    await db.$queryRaw`SELECT COUNT(Jelzesek.id) AS jelzesek_count FROM Kuka LEFT JOIN Jelzesek ON Jelzesek.kukaId = Kuka.id AND Jelzesek.jelzes_datum > Kuka.legutobbi_urites AND Jelzesek.felhasznaloId = ${req.session.userId} AND Kuka.id = ${id};`;

  if (result.length > 0 && result[0].jelzesek_count > 0) {
    return res.json({ error: "Ezt a kukát már jelentetted!" });
  }

  const jelzes = await db.jelzesek.create({
    data: {
      felhasznaloId: req.session.userId,
      kukaId: parseInt(id),
      jelzes_datum: new Date(),
    },
  });

  res.json({ success: true });
});
app.get("/kuka/del", async (req, res) => {
  if (!req.session.adminId) {
    return res.json({ error: "Nincs jogosultság" });
  }
  await db.kuka.deleteMany();
});
app.get("/kuka/seed", async (req, res) => {
  if (!req.session.adminId) {
    return res.json({ error: "Nincs jogosultság" });
  }
  function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }

  for (let index = 0; index < 500; index++) {
    const lat = getRandomArbitrary(47.680064876272574, 47.69335866460795);
    const lng = getRandomArbitrary(16.558594085149714, 16.620312920669303);

    await db.kuka.create({
      data: {
        location_x: lat.toString(),
        location_y: lng.toString(),
        legutobbi_urites: new Date(0),
        allapot: Math.random() * 100,
      },
    });
  }

  res.json({ success: true });
});

app.post("/uj-kuka", async (req, res) => {
  if (!req.session.adminId) {
    //return res.json({ error: "Nincs jogosultság" });
  }
  const { location_x, location_y } = req.body;
  console.log(req.body);
  const newKuka = await db.kuka.create({
    data: {
      location_x: location_x.toString(),
      location_y: location_y.toString(),
      legutobbi_urites: new Date(0),
      allapot: 0,
    },
  });
  res.json(newKuka);
});

app.get("/map", async (req, res) => {
  const kukak =
    await db.$queryRaw`SELECT Kuka.*, COUNT(Jelzesek.id) AS jelzesek_count FROM Kuka LEFT JOIN Jelzesek ON Jelzesek.kukaId = Kuka.id AND Jelzesek.jelzes_datum > Kuka.legutobbi_urites GROUP BY Kuka.id;`;
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

module.exports = app;
