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
   MOCK VALIDATION MIDDLEWARE
======================= */
jest.mock("../src/middlewares/validation.middleware", () => ({
  validateShippingAddress: (req, res, next) => next(),
  validateUpdateShippingAddress: (req, res, next) => next(),
}));

/* =======================
   MOCK ORDER MODEL
======================= */
jest.mock("../src/models/order.model", () => ({
  findById: jest.fn(),
}));

const orderModel = require("../src/models/order.model");

describe("PATCH /api/orders/:id/address", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =======================
        SUCCESS CASE
  ======================= */

  it("should update shipping address when order is PENDING and user is owner", async () => {
    const saveMock = jest.fn();

    orderModel.findById.mockResolvedValue({
      _id: "order1",
      user: "user123",
      status: "PENDING",
      shippingAddress: {},
      save: saveMock,
    });

    const res = await request(app)
      .patch("/api/orders/order1/address")
      .set("Authorization", "Bearer valid")
      .send({
        shippingAddress: {
          street: "123 Main St",
          city: "Delhi",
          state: "DL",
          zipCode: "110001",
          country: "India",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.order).toBeDefined();
    expect(saveMock).toHaveBeenCalled();
  });

  /* =======================
        ORDER NOT FOUND
  ======================= */

  it("should return 404 if order not found", async () => {
    orderModel.findById.mockResolvedValue(null);

    const res = await request(app)
      .patch("/api/orders/order1/address")
      .set("Authorization", "Bearer valid")
      .send({
        shippingAddress: { city: "Delhi" },
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Order not found");
  });

  /* =======================
        FORBIDDEN ACCESS
  ======================= */

  it("should return 403 if user is not order owner", async () => {
    orderModel.findById.mockResolvedValue({
      _id: "order1",
      user: "anotherUser",
      status: "PENDING",
    });

    const res = await request(app)
      .patch("/api/orders/order1/address")
      .set("Authorization", "Bearer valid")
      .send({
        shippingAddress: { city: "Delhi" },
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });

  /* =======================
        INVALID ORDER STATUS
  ======================= */

  it("should return 409 if order status is not PENDING", async () => {
    orderModel.findById.mockResolvedValue({
      _id: "order1",
      user: "user123",
      status: "SHIPPED",
    });

    const res = await request(app)
      .patch("/api/orders/order1/address")
      .set("Authorization", "Bearer valid")
      .send({
        shippingAddress: { city: "Delhi" },
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/cannot be update address/i);
  });

  /* =======================
        SERVER ERROR
  ======================= */

  it("should return 500 on database error", async () => {
    orderModel.findById.mockRejectedValue(
      new Error("DB failure")
    );

    const res = await request(app)
      .patch("/api/orders/order1/address")
      .set("Authorization", "Bearer valid")
      .send({
        shippingAddress: { city: "Delhi" },
      });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });
});
