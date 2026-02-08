import session from "express-session";

const sessionMiddleware = session({
  secret: "sharego",
  saveUninitialized: false,
  resave: false,
});

export default sessionMiddleware;
