// const jsonServer = require("json-server");
// const jsonServer = require("json-server");
// const { v4: uuid } = require("uuid");
import jsonServer from "json-server";
import { v4 as uuid } from "uuid";

const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

// 🔐 Fake JWT generator
const generateToken = () => "fake-jwt-token-" + uuid();

// AUTH REGISTER
server.post("/auth/register", (req, res) => {
  const db = router.db;
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "validation failed",
      fields: { email: "is required" }
    });
  }

  const existing = db.get("users").find({ email }).value();
  if (existing) {
    return res.status(400).json({ error: "user already exists" });
  }

  const user = { id: uuid(), name, email, password };
  db.get("users").push(user).write();

  res.status(201).json({
    token: generateToken(),
    user: { id: user.id, name, email }
  });
});

// LOGIN
server.post("/auth/login", (req, res) => {
  const db = router.db;
  const { email, password } = req.body;

  const user = db.get("users").find({ email, password }).value();

  if (!user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  res.json({
    token: generateToken(),
    user: { id: user.id, name: user.name, email }
  });
});

// AUTH MIDDLEWARE
server.use((req, res, next) => {
  if (req.path.startsWith("/projects")) {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.status(401).json({ error: "unauthorized" });
    }
  }
  next();
});

// PROJECTS
server.get("/projects", (req, res) => {
  const projects = router.db.get("projects").value();
  res.json({ projects });
});

server.post("/projects", (req, res) => {
  const db = router.db;
  const project = {
    id: uuid(),
    ...req.body,
    owner_id: uuid(),
    created_at: new Date().toISOString()
  };

  db.get("projects").push(project).write();
  res.status(201).json(project);
});

server.get("/projects/:id", (req, res) => {
  const db = router.db;
  const project = db.get("projects").find({ id: req.params.id }).value();

  if (!project) return res.status(404).json({ error: "not found" });

  const tasks = db.get("tasks").filter({ project_id: req.params.id }).value();

  res.json({ ...project, tasks });
});

// TASKS
server.post("/projects/:id/tasks", (req, res) => {
  const db = router.db;

  const task = {
    id: uuid(),
    project_id: req.params.id,
    status: "todo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...req.body
  };

  db.get("tasks").push(task).write();
  res.status(201).json(task);
});

server.get("/projects/:id/tasks", (req, res) => {
  const db = router.db;
  let tasks = db.get("tasks").filter({ project_id: req.params.id }).value();

  const { status, assignee } = req.query;

  if (status) tasks = tasks.filter(t => t.status === status);
  if (assignee) tasks = tasks.filter(t => t.assignee_id === assignee);

  res.json({ tasks });
});

server.patch("/tasks/:id", (req, res) => {
  const db = router.db;

  const task = db.get("tasks").find({ id: req.params.id }).value();
  if (!task) return res.status(404).json({ error: "not found" });

  const updated = {
    ...task,
    ...req.body,
    updated_at: new Date().toISOString()
  };

  db.get("tasks").find({ id: req.params.id }).assign(updated).write();
  res.json(updated);
});

server.delete("/tasks/:id", (req, res) => {
  router.db.get("tasks").remove({ id: req.params.id }).write();
  res.status(204).send();
});

// START SERVER
server.use(router);
server.listen(4000, () => {
  console.log("Mock API running on http://localhost:4000");
});