import session from "express-session";
//configures the rules for how sessions will work.
//created a Session Store
//no one is logged in yet
export const sessionMiddleware = session({
  secret: "sharego",
  saveUninitialized: false,
  resave: false,
});

export default sessionMiddleware;
