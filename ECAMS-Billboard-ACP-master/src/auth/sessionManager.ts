import { Request, Response } from "express";

export const UserAuthMiddleware = (req: Request, res: Response, next: any) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(403);
    res.render("403", {
      layout: "main",
      user: req.user,
      message: "You must be logged in to continue",
    });
  }
};
