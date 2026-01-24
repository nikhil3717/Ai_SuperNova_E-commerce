const request = require("supertest");
const app = require("../src/app");

/* =======================
   MOCK AUTH MIDDLEWARE
======================= */
jest.mock("../src/middlewares/auth.middleware", () => {
  return () => (req, res, next) => {
    req.user = {
      id: "user123",
      role: "user",
    };
    next();
  };
});

/* =======================
   MOCK ORDER MODEL
======================= */
jest.mock("../src/models/order.model", () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

const orderModel = require("../src/models/order.model");

describe("GET /api/orders/me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =======================
        SUCCESS CASE
  ======================= */

  it("should return paginated orders for logged-in user", async () => {
    const mockOrders = [
      { _id: "order1", totalPrice: { amount: 200 } },
      { _id: "order2", totalPrice: { amount: 150 } },
    ];

    orderModel.find.mockResolvedValue(mockOrders);
    orderModel.countDocuments.mockResolvedValue(5);

    const res = await request(app)
      .get("/api/orders/me?page=2&limit=2")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);

    expect(res.body.orders.length).toBe(2);
    expect(res.body.meta).toEqual({
      total: 5,
      page: 2,
      limit: 2,
      skip: 2,
    });

    expect(orderModel.find).toHaveBeenCalledWith({ user: "user123" });
    expect(orderModel.countDocuments).toHaveBeenCalledWith({
      user: "user123",
    });
  });

  /* =======================
        DEFAULT PAGINATION
  ======================= */

  it("should use default pagination values when query not provided", async () => {
    orderModel.find.mockResolvedValue([]);
    orderModel.countDocuments.mockResolvedValue(0);

    const res = await request(app)
      .get("/api/orders/me")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(10);
    expect(res.body.meta.skip).toBe(0);
  });

  /* =======================
        ERROR CASE
  ======================= */

  it("should return 500 if database throws error", async () => {
    orderModel.find.mockRejectedValue(
      new Error("Database failure")
    );

    const res = await request(app)
      .get("/api/orders/me")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });
});
