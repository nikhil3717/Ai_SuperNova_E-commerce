const jwt = require("jsonwebtoken")

function createAuthMiddleware(roles = ["user"]) {
  return function AuthMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers?.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      if (!roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Forbidden: You are not authorized to access this resource" })
      }
      req.user = decoded
      next()
    } catch (error) {
      console.log(error)
      return res.status(401).json({ message: "Unauthorized: Invalid token" })
    }
  }
}


module.exports = createAuthMiddleware