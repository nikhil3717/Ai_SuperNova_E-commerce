const request = require("supertest");
const app = require("../src/app");

/* =======================
   MOCK AUTH MIDDLEWARE
======================= */
jest.mock("../src/middlewares/auth.middleware", () => {
  return () => (req, res, next) => {
    const role = req.headers["x-role"] || "user";
    req.user = { id: "user123", role };
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

describe("POST /api/orders/:id/cancel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should cancel order successfully", async () => {
    const saveMock = jest.fn();

    orderModel.findById.mockResolvedValue({
      _id: "order1",
      user: "user123",
      status: "PENDING",
      save: saveMock,
    });

    const res = await request(app)
      .post("/api/orders/order1/cancel")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(saveMock).toHaveBeenCalled();
  });

  it("should return 404 if order not found", async () => {
    orderModel.findById.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/orders/order1/cancel")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Order not found");
  });

  it("should return 403 if user is not owner", async () => {
    orderModel.findById.mockResolvedValue({
      _id: "order1",
      user: "anotherUser",
      status: "PENDING",
    });

    const res = await request(app)
      .post("/api/orders/order1/cancel")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(403);
  });

  it("should allow admin to cancel any order", async () => {
    const saveMock = jest.fn();

    orderModel.findById.mockResolvedValue({
      _id: "order1",
      user: "anotherUser",
      status: "PENDING",
      save: saveMock,
    });

    const res = await request(app)
      .post("/api/orders/order1/cancel")
      .set("Authorization", "Bearer valid")
      .set("x-role", "admin");

    expect(res.status).toBe(200);
    expect(saveMock).toHaveBeenCalled();
  });

  it("should return 400 if order already cancelled", async () => {
    orderModel.findById.mockResolvedValue({
      _id: "order1",
      user: "user123",
      status: "CANCELLED",
    });

    const res = await request(app)
      .post("/api/orders/order1/cancel")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(400);
  });

  it("should return 400 if order already delivered", async () => {
    orderModel.findById.mockResolvedValue({
      _id: "order1",
      user: "user123",
      status: "DELIVERED",
    });

    const res = await request(app)
      .post("/api/orders/order1/cancel")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(400);
  });

  it("should return 500 on database error", async () => {
    orderModel.findById.mockRejectedValue(
      new Error("DB error")
    );

    const res = await request(app)
      .post("/api/orders/order1/cancel")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(500);
  });
});
