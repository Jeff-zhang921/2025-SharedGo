import session from "express-session";
//configures the rules for how sessions will work.
//created a Session Store
//no one is logged in yet

const ONE_DAY = 24 * 60 * 60 * 1000;
export const sessionMiddleware = session({
  secret: "sharego",
  saveUninitialized: false,
  resave: false,
  rolling: true, // This is a "keep-alive" feature. Every time the user makes a request, the expiration timer on their cookie is reset
  cookie: {
    maxAge: 7 * ONE_DAY, // 7 days
  },
});

export default sessionMiddleware;
