const request = require("supertest");
const app = require("../src/app");
const axios = require("axios");

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
   MOCK SHIPPING VALIDATION
======================= */
jest.mock("../src/middlewares/validation.middleware", () => ({
  validateShippingAddress: (req, res, next) => next(),
  validateUpdateShippingAddress: (req, res, next) => next(),
}));

/* =======================
   MOCK AXIOS
======================= */
jest.mock("axios");

/* =======================
   MOCK ORDER MODEL
======================= */
jest.mock("../src/models/order.model", () => ({
  create: jest.fn(),
}));

const orderModel = require("../src/models/order.model");

describe("POST /api/orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =======================
        SUCCESS CASE
  ======================= */

  it("should create order successfully from cart", async () => {
    // Mock axios with fast implementation
    axios.get.mockImplementation((url) => {
      if (url.includes("/cart")) {
        return Promise.resolve({
          data: {
            cart: {
              items: [
                { productId: "prod1", quantity: 2 },
                { productId: "prod2", quantity: 1 },
              ],
            },
          },
        });
      }

      if (url.includes("prod1")) {
        return Promise.resolve({
          data: {
            product: {
              _id: "prod1",
              title: "Product 1",
              stock: 10,
              price: { amount: 100, currency: "INR" },
            },
          },
        });
      }

      if (url.includes("prod2")) {
        return Promise.resolve({
          data: {
            product: {
              _id: "prod2",
              title: "Product 2",
              stock: 5,
              price: { amount: 50, currency: "INR" },
            },
          },
        });
      }
    });

    orderModel.create.mockResolvedValue({
      _id: "order123",
      status: "PENDING",
    });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", "Bearer valid")
      .send({
        street: "123 Main St",
        city: "NYC",
        state: "NY",
        zip: "10001",
        country: "USA",
        isDefault: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order.status).toBe("PENDING");
    expect(orderModel.create).toHaveBeenCalled();
  });

  /* =======================
        STOCK ERROR
  ======================= */

  it("should fail if product stock is insufficient", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/cart")) {
        return Promise.resolve({
          data: {
            cart: {
              items: [{ productId: "prod1", quantity: 5 }],
            },
          },
        });
      }

      if (url.includes("prod1")) {
        return Promise.resolve({
          data: {
            product: {
              _id: "prod1",
              title: "Product 1",
              stock: 2, // insufficient
              price: { amount: 100, currency: "INR" },
            },
          },
        });
      }
    });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", "Bearer valid")
      .send({
        street: "123 Main St",
        city: "NYC",
        state: "NY",
        zip: "10001",
        country: "USA",
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/out of stock/i);
  });

  /* =======================
        CART SERVICE FAIL
  ======================= */

  it("should fail if cart service fails", async () => {
    axios.get.mockRejectedValue(new Error("Cart service down"));

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", "Bearer valid")
      .send({
        street: "123 Main St",
        city: "NYC",
        state: "NY",
        zip: "10001",
        country: "USA",
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  /* =======================
        PRODUCT SERVICE FAIL
  ======================= */

  it("should fail if product service fails", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          cart: {
            items: [{ productId: "prod1", quantity: 1 }],
          },
        },
      })
      .mockRejectedValueOnce(new Error("Product service error"));

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", "Bearer valid")
      .send({
        street: "123 Main St",
        city: "NYC",
        state: "NY",
        zip: "10001",
        country: "USA",
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
