const request = require("supertest");
const app = require("../src/app");

/* =======================
   MOCK VALIDATION MIDDLEWARE
======================= */
jest.mock("../src/middlewares/validation.middleware", () => ({
  validateAddItemToCart: (req, res, next) => {
    const { productId, qty } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    if (!qty || qty <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    next();
  },

  validateUpdateCartItem: (req, res, next) => next(),
}));


/* =======================
   MOCK AUTH MIDDLEWARE
======================= */
jest.mock("../src/middlewares/auth.middleware", () => {
  return (roles = ["user"]) =>
    (req, res, next) => {
      const auth = req.headers.authorization;

      if (!auth) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (auth === "Bearer invalid") {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }

      // 👇 ROLE CONTROL VIA HEADER
      const role = req.headers["x-role"] || "user";

      if (!roles.includes(role)) {
        return res.status(403).json({
          message: "Forbidden: You are not authorized to access this resource",
        });
      }

      req.user = {
        _id: "user123",
        role,
      };

      next();
    };
});


/* =======================
   MOCK CART MODEL (COMMONJS SAFE)
======================= */
jest.mock("../src/models/cart.model", () => {
  const mockSave = jest.fn();
  const mockFindOne = jest.fn();

  function Cart(data) {
    this.user = data.user;
    this.items = data.items;
    this.save = mockSave;
  }

  Cart.findOne = mockFindOne;

  Cart.__mocks__ = {
    mockSave,
    mockFindOne,
  };

  return Cart;
});

const Cart = require("../src/models/cart.model");
const { mockSave, mockFindOne } = Cart.__mocks__;

describe("POST /api/cart/items", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =======================
     SUCCESS CASES
  ======================= */

  it("creates new cart and adds first item", async () => {
    mockFindOne.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", "Bearer valid")
      .send({ productId: "prod1", qty: 2 });

    expect(res.status).toBe(200);
    expect(res.body.cart.items.length).toBe(1);
    expect(res.body.cart.items[0]).toEqual({
      productId: "prod1",
      quantity: 2,
    });
    expect(mockSave).toHaveBeenCalled();
  });

  it("increments quantity when item already exists", async () => {
    mockFindOne.mockResolvedValue({
      user: "user123",
      items: [{ productId: "prod1", quantity: 1 }],
      save: mockSave,
    });

    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", "Bearer valid")
      .send({ productId: "prod1", qty: 3 });

    expect(res.status).toBe(200);
    expect(res.body.cart.items[0].quantity).toBe(4);
  });

  /* =======================
     VALIDATION ERRORS
  ======================= */

  it("validation error for invalid productId", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", "Bearer valid")
      .send({ qty: 2 });

    expect(res.status).toBe(400);
  });

  it("validation error for non-positive qty", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", "Bearer valid")
      .send({ productId: "prod1", qty: 0 });

    expect(res.status).toBe(400);
  });

  /* =======================
     AUTH ERRORS
  ======================= */

  it("401 when no token provided", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .send({ productId: "prod1", qty: 1 });

    expect(res.status).toBe(401);
  });

it("403 when role not allowed", async () => {
  const res = await request(app)
    .post("/api/cart/items")
    .set("Authorization", "Bearer valid")
    .set("x-role", "admin") // 👈 role not allowed (route allows only "user")
    .send({ productId: "prod1", qty: 1 });

  expect(res.status).toBe(403);
});


  it("401 when token invalid", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", "Bearer invalid")
      .send({ productId: "prod1", qty: 1 });

    expect(res.status).toBe(401);
  });
});
