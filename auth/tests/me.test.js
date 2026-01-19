const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

describe("GET /api/auth/me", () => {

  let user;
  let token;

  beforeEach(async () => {
    await User.deleteMany({});

    const hashedPassword = await bcrypt.hash("password123", 10);

    user = await User.create({
      username: "testuser",
      email: "test@example.com",
      password: hashedPassword,
      fullName: {
        firstName: "John",
        lastName: "Doe"
      }
    });

    token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
  });

  it("should return current logged in user when valid token is provided", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe(user.email);
    expect(response.body.user.username).toBe(user.username);
    expect(response.body.user.fullName.firstName).toBe("John");
  });

  it("should return 401 if token is missing", async () => {
    const response = await request(app)
      .get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized");
  });

  it("should return 401 if token is invalid", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`token=invalidtoken123`]);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized");
  });

  it("should return 401 if token is expired", async () => {
    const expiredToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "-1s" }
    );

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`token=${expiredToken}`]);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized");
  });

  it("should return 404 if user does not exist", async () => {
    await User.deleteMany({});

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`token=${token}`]);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

});
