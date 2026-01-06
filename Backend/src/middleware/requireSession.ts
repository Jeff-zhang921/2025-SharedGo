//Blocks requests if the user is not logged in (no session user)
//If logged in, it injects the user’s email/name into req.body
//Saves the user into res.locals for later handlers
import { NextFunction, Request, Response } from "express";
const AUTH_REQUIRED_MESSAGE = "Not authenticated.";

//
export function requireSession(req: Request, res: Response, next: NextFunction) {
  //if app is running in test mode skips authentication
  if (process.env.NODE_ENV === "test") {
    next();
    return;
  }

  //read user from session
  const user = req.session.user;
  //if there is no session user
  if (!user) {
    res.status(401).json({ message: AUTH_REQUIRED_MESSAGE });
    return;
  }
  //ensure req.body is an object
  if (!req.body || typeof req.body !== "object") {
    req.body = {};
  }

const body = req.body as any;

  body.email = user.email;
  body.hostEmail = user.email;

  //if user has name and body has no name, inject name into body
  if (user.name && !body.name) {
    body.name = user.name;
  }
//res.locals is a per-request storage area for passing data to later handlers.
  res.locals.sessionUser = user;
  next();
}
//authentication pass