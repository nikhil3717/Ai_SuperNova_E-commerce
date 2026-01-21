const request = require("supertest");
const app = require("../src/app");

/* =======================
   MOCK VALIDATION
======================= */
jest.mock("../src/middlewares/validation.middleware", () => ({
  validateAddItemToCart: (req, res, next) => next(),
  validateUpdateCartItem: (req, res, next) => next(),
}));


/* =======================
   MOCK AUTH (ROLE-AWARE)
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

      const role = req.headers["x-role"] || "user";

      if (!roles.includes(role)) {
        return res.status(403).json({
          message: "Forbidden: You are not authorized to access this resource",
        });
      }

      req.user = { _id: "user123", role };
      next();
    };
});

/* =======================
   MOCK CART MODEL (COMMONJS)
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

describe("PATCH /api/cart/items/:productId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =======================
     SUCCESS CASES
  ======================= */

  it("updates quantity when item exists", async () => {
    mockFindOne.mockResolvedValue({
      user: "user123",
      items: [{ productId: "prod1", quantity: 2 }],
      save: mockSave,
    });

    const res = await request(app)
      .patch("/api/cart/items/prod1")
      .set("Authorization", "Bearer valid")
      .send({ qty: 5 });

    expect(res.status).toBe(200);
    expect(res.body.cart.items[0].quantity).toBe(5);
    expect(mockSave).toHaveBeenCalled();
  });

  it("removes item when qty <= 0", async () => {
    mockFindOne.mockResolvedValue({
      user: "user123",
      items: [{ productId: "prod1", quantity: 2 }],
      save: mockSave,
    });

    const res = await request(app)
      .patch("/api/cart/items/prod1")
      .set("Authorization", "Bearer valid")
      .send({ qty: 0 });

    expect(res.status).toBe(200);
    expect(res.body.cart.items.length).toBe(0);
    expect(mockSave).toHaveBeenCalled();
  });

  /* =======================
     ERROR CASES
  ======================= */

  it("returns 404 if cart not found", async () => {
    mockFindOne.mockResolvedValue(null);

    const res = await request(app)
      .patch("/api/cart/items/prod1")
      .set("Authorization", "Bearer valid")
      .send({ qty: 2 });

    expect(res.status).toBe(404);
  });

  it("returns 404 if product not in cart", async () => {
    mockFindOne.mockResolvedValue({
      user: "user123",
      items: [],
      save: mockSave,
    });

    const res = await request(app)
      .patch("/api/cart/items/prod1")
      .set("Authorization", "Bearer valid")
      .send({ qty: 2 });

    expect(res.status).toBe(404);
  });

  it("401 when no token provided", async () => {
    const res = await request(app)
      .patch("/api/cart/items/prod1")
      .send({ qty: 2 });

    expect(res.status).toBe(401);
  });

  it("403 when role not allowed", async () => {
    const res = await request(app)
      .patch("/api/cart/items/prod1")
      .set("Authorization", "Bearer valid")
      .set("x-role", "admin")
      .send({ qty: 2 });

    expect(res.status).toBe(403);
  });

  it("401 when token invalid", async () => {
    const res = await request(app)
      .patch("/api/cart/items/prod1")
      .set("Authorization", "Bearer invalid")
      .send({ qty: 2 });

    expect(res.status).toBe(401);
  });
});
