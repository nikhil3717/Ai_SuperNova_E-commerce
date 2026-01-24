const request = require("supertest");
const app = require("../src/app");

/* =======================
   MOCK AUTH MIDDLEWARE
======================= */
jest.mock("../src/middlewares/auth.middleware", () => {
  return () => (req, res, next) => {
    // role can be overridden per test using header
    const role = req.headers["x-role"] || "user";

    req.user = {
      id: "user123",
      role,
    };
    next();
  };
});

/* =======================
   MOCK ORDER MODEL
======================= */
jest.mock("../src/models/order.model", () => ({
  findById: jest.fn(),
}));

const orderModel = require("../src/models/order.model");

describe("GET /api/orders/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =======================
        SUCCESS CASES
  ======================= */

  it("should return order when user is the owner", async () => {
    orderModel.findById.mockResolvedValue({
      _id: "order1",
      user: "user123",
      totalPrice: { amount: 200 },
    });

    const res = await request(app)
      .get("/api/orders/order1")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body.order._id).toBe("order1");
  });

  it("should return order when user is admin", async () => {
    orderModel.findById.mockResolvedValue({
      _id: "order1",
      user: "anotherUser",
      totalPrice: { amount: 300 },
    });

    const res = await request(app)
      .get("/api/orders/order1")
      .set("Authorization", "Bearer valid")
      .set("x-role", "admin");

    expect(res.status).toBe(200);
    expect(res.body.order._id).toBe("order1");
  });

  /* =======================
        NOT FOUND
  ======================= */

  it("should return 404 if order not found", async () => {
    orderModel.findById.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/orders/order1")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("order not found");
  });

  /* =======================
        FORBIDDEN
  ======================= */

  it("should return 403 if user is not owner and not admin", async () => {
    orderModel.findById.mockResolvedValue({
      _id: "order1",
      user: "anotherUser",
    });

    const res = await request(app)
      .get("/api/orders/order1")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });

  /* =======================
        SERVER ERROR
  ======================= */

  it("should return 500 if database throws error", async () => {
    orderModel.findById.mockRejectedValue(
      new Error("Database error")
    );

    const res = await request(app)
      .get("/api/orders/order1")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("Internal server error");
  });
});
