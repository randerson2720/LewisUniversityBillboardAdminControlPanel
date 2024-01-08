import session from "cookie-session";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { engine } from "express-handlebars";
import FormData from "form-data";
import handlebars from "handlebars";
import multer from "multer";
import fetch from "node-fetch";
import passport from "passport";
import path from "path";
import { ulid } from "ulid";
import passportConfig from "./auth/passportConfig";
import { UserAuthMiddleware } from "./auth/sessionManager";
import db from "./db";
import BannerModel from "./models/BannerModel";
import DepartmentModel from "./models/DepartmentModel";
import ProfessorModel from "./models/ProfessorModel";
import User from "./models/User";

const app = express();
dotenv.config({ path: path.join(__dirname, "../.env") });
db.connect();
passportConfig(passport);

const port = process.env.PORT || 3000;

// Use Express to publish static HTML, CSS, and JavaScript files that run in the browser.
app.use(express.static(path.join(__dirname, "../src/static")));

// Add session support
app.use(
  session({
    name: "session",
    keys: [process.env.SESSION_SECRET || "default_session_secret"],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((userDataFromCookie, done) => {
  done(null, userDataFromCookie);
});

app.get("/", (req: Request, res: Response) =>
  res.render("home", {
    layout: "main",
    user: req.user,
  })
);

app.get("/ping", (_req, res) => {
  console.log("Ping recieved");
  res.type("text/plain");
  res.send("Pong!");
});

// Auth routes
app.get(
  "/login",
  passport.authenticate("google", {
    scope: ["email", "profile"],
    failureRedirect: "/unauthorized",
  })
);

app.get("/logout", (req: Request, res: Response) => {
  res.clearCookie("session");
  res.redirect("/");
});

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: true,
    failureRedirect: "/unauthorized",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get("/protected", UserAuthMiddleware, (req, res) => {
  res.json({
    message: "You have accessed the protected endpoint!",
    yourUserInfo: req.user,
  });
});

app.get("/users/manage", UserAuthMiddleware, async (req, res) => {
  const users = await User.find({}).lean();
  res.render("users/manage", {
    layout: "main",
    user: req.user,
    users: users.map((val) => {
      return {
        id: val.id,
        name: val.name,
        email: val.email,
      };
    }),
  });
});

app.get("/users/add", UserAuthMiddleware, async (req, res) => {
  res.render("users/edit", {
    layout: "main",
    user: req.user,
    userToEdit: null,
  });
});

app.get("/users/edit/:id", UserAuthMiddleware, async (req, res) => {
  const userToEdit = await User.findOne({ id: req.params.id });
  if (!userToEdit) return res.redirect("/users/manage");

  res.render("users/edit", {
    layout: "main",
    user: req.user,
    userToEdit: {
      id: userToEdit.id,
      name: userToEdit.name,
      email: userToEdit.email,
    },
  });
});

app.post(
  "/users/add",
  UserAuthMiddleware,
  multer().none(),
  async (req, res) => {
    const newUser = new User({
      id: ulid(),
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
    });
    await newUser.save();

    res.redirect("/users/manage");
  }
);

app.post(
  "/users/edit",
  UserAuthMiddleware,
  multer().none(),
  async (req, res) => {
    await User.updateOne(
      { id: req.body.id },
      {
        $set: {
          id: req.body.id,
          name: req.body.name,
          email: req.body.email,
          role: req.body.role,
        },
      }
    );

    res.redirect("/users/manage");
  }
);

app.get("/users/delete/:id", UserAuthMiddleware, async (req, res) => {
  await User.deleteOne({ id: req.params.id });

  res.redirect("/users/manage");
});

app.get("/data/manage", UserAuthMiddleware, async (req, res) => {
  const professors = await ProfessorModel.find({}).lean();
  professors.sort((a, b) => (a.name > b.name ? 1 : -1));
  res.render("data/manage", {
    layout: "main",
    user: req.user,
    professors,
  });
});

app.get("/data/add", UserAuthMiddleware, async (req, res) => {
  const departments = await DepartmentModel.find({}).lean();
  res.render("data/edit", {
    layout: "main",
    user: req.user,
    professor: null,
    departments,
  });
});

app.get("/data/edit/:id", UserAuthMiddleware, async (req, res) => {
  const professor = await ProfessorModel.findOne({ id: req.params.id }).lean();
  const departments = await DepartmentModel.find({}).lean();
  if (!professor) return res.redirect("/data/manage");

  res.render("data/edit", {
    layout: "main",
    user: req.user,
    professor,
    departments,
  });
});

app.post("/data/add", UserAuthMiddleware, multer().none(), async (req, res) => {
  console.log(req.body);
  const newProfessor = new ProfessorModel({
    id: ulid(),
    name: req.body.name,
    email: req.body.email,
    hours: req.body.hours,
    room: req.body.room,
    phone: req.body.phone,
    website: req.body.website,
    department: req.body.department,
  });
  await newProfessor.save();

  res.redirect("/data/manage");
});

app.post(
  "/data/edit",
  UserAuthMiddleware,
  multer().single("file"),
  async (req, res) => {
    await ProfessorModel.updateOne(
      { id: req.body.id },
      {
        $set: {
          id: req.body.id,
          name: req.body.name,
          email: req.body.email,
          hours: req.body.hours,
          room: req.body.room,
          phone: req.body.phone,
          website: req.body.website,
          department: req.body.department,
        },
      }
    );

    res.redirect("/data/manage");
  }
);

app.get("/data/delete/:id", UserAuthMiddleware, async (req, res) => {
  await ProfessorModel.deleteOne({ id: req.params.id });

  res.redirect("/data/manage");
});

// Banner management
app.get("/banners/manage", UserAuthMiddleware, async (req, res) => {
  const banners = await BannerModel.find({}).lean();
  res.render("banners/manage", {
    layout: "main",
    user: req.user,
    banners,
  });
});

app.get("/banners/add", UserAuthMiddleware, async (req, res) => {
  res.render("banners/edit", {
    layout: "main",
    user: req.user,
    banner: null,
  });
});

app.get("/banners/edit/:id", UserAuthMiddleware, async (req, res) => {
  const banner = await BannerModel.findOne({ id: req.params.id }).lean();
  if (!banner) return res.redirect("/banners/manage");

  res.render("banners/edit", {
    layout: "main",
    user: req.user,
    banner,
  });
});

app.post(
  "/banners/add",
  UserAuthMiddleware,
  multer().single("file"),
  async (req, res) => {
    const formData = new FormData();
    if (req.file !== null)
      formData.append("file", req.file.buffer, req.file.originalname);

    await fetch(process.env.API_BASE_URI + "api/images", {
      method: "PUT",
      body: formData,
    })
      .then((Res) => Res.json())
      .then(async (json) => {
        const newBanner = new BannerModel({
          id: ulid(),
          name: req.body.name,
          email: req.body.email,
          hours: req.body.hours,
          room: req.body.room,
          phone: req.body.phone,
          website: req.body.website,
          image_name: json.filename,
        });
        await newBanner.save();

        res.redirect("/banners/manage");
      })
      .catch((err) => {
        console.log(err);
        res.json("An error occured while trying to upload an image.");
      });
  }
);

app.post(
  "/banners/edit",
  UserAuthMiddleware,
  multer().single("file"),
  async (req, res) => {
    const existingImage = (await BannerModel.findOne({ id: req.body.id }))
      .image_name;

    if (req.file !== undefined) {
      const formData = new FormData();
      formData.append("file", req.file.buffer, req.file.originalname);

      await fetch(process.env.API_BASE_URI + "api/images/" + existingImage, {
        method: "PATCH",
        body: formData,
      });
    }

    await BannerModel.updateOne(
      { id: req.body.id },
      {
        $set: {
          id: req.body.id,
          name: req.body.name,
          image_name: existingImage,
        },
      }
    );

    res.redirect("/banners/manage");
  }
);

app.get("/banners/delete/:id", UserAuthMiddleware, async (req, res) => {
  const imageName = (await BannerModel.findOne({ id: req.params.id }))
    .image_name;
  await BannerModel.deleteOne({ id: req.params.id });

  fetch(process.env.API_BASE_URI + "/api/images/" + imageName, {
    method: "DELETE",
  });

  res.redirect("/banners/manage");
});

// department management

app.get("/departments/manage", UserAuthMiddleware, async (req, res) => {
  const departments = await DepartmentModel.find({}).lean();
  departments.sort((a, b) => (a.name > b.name ? 1 : -1));
  res.render("departments/manage", {
    layout: "main",
    user: req.user,
    departments,
  });
});

app.get("/departments/add", UserAuthMiddleware, async (req, res) => {
  res.render("departments/edit", {
    layout: "main",
    user: req.user,
    department: null,
  });
});

app.get("/departments/edit/:id", UserAuthMiddleware, async (req, res) => {
  const department = await DepartmentModel.findOne({ id: req.params.id }).lean();
  if (!department) return res.redirect("/departments/manage");

  res.render("departments/edit", {
    layout: "main",
    user: req.user,
    department,
  });
});

app.post("/departments/add", UserAuthMiddleware, multer().none(), async (req, res) => {
  const newDepartment = new DepartmentModel({
    id: ulid(),
    name: req.body.name,
    short_name: req.body.short_name,
  });
  await newDepartment.save();

  res.redirect("/departments/manage");
});

app.post(
  "/departments/edit",
  UserAuthMiddleware,
  multer().none(),
  async (req, res) => {
    // TODO: Update all professors if the short_name changes
    await DepartmentModel.updateOne(
      { id: req.body.id },
      {
        $set: {
          id: req.body.id,
          name: req.body.name,
          short_name: req.body.short_name,
        },
      }
    );

    res.redirect("/departments/manage");
  }
);

app.get("/departments/delete/:id", UserAuthMiddleware, async (req, res) => {
  await DepartmentModel.deleteOne({ id: req.params.id });

  res.redirect("/departments/manage");
});

// custom 403 page
app.get("/unauthorized", (req, res) => {
  res.status(403);
  res.render("403", {
    layout: "main",
    user: req.user,
    message:
      "You have not been given access to the ECAMS Billboard ACP. Please contact an administrator for access.",
  });
});

// custom 404 page
app.use((req, res) => {
  res.status(404);
  res.render("404", {
    layout: "main",
    user: req.user,
  });
});

// custom 500 page
app.use((err: Error, req: Request, res: Response) => {
  console.error(err.message);
  res.status(500);
  res.render("500", {
    layout: "main",
    user: req.user,
  });
});

app.listen(port, () =>
  console.log(
    `Express started at \"http://localhost:${port}\"\n` +
      `press Ctrl-C to terminate.`
  )
);

// configure Handlebars view engine
app.engine(
  "handlebars",
  engine({
    defaultLayout: "main",
    helpers: {
      section(name: string | number, options: { fn: (arg0: any) => any }): any {
        if (!this._sections) {
          this._sections = {};
        }
        this._sections[name] = options.fn(this);
        return null;
      },
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "../src/views"));

handlebars.registerHelper("inc", (value, options) => {
  return parseInt(value, 10) + 1;
});

handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
  return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});

handlebars.registerHelper('ifCond', function(v1, v2, options) {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});
