const jwt = require("jsonwebtoken");

const AuthMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // console.log(decoded)

    // ONLY store user id from token
    req.user = decoded ;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = AuthMiddleware;
