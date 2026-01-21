const request = require("supertest");
const app = require("../src/app");

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

      req.user = {
        _id: "user123",
        role: "user",
      };

      next();
    };
});

/* =======================
   MOCK CART MODEL (CommonJS-safe)
======================= */
jest.mock("../src/models/cart.model", () => {
  const mockFindOne = jest.fn();
  const mockSave = jest.fn();

  function Cart(data) {
    this.user = data.user;
    this.items = data.items;
    this.save = mockSave;
  }

  Cart.findOne = mockFindOne;

  Cart.__mocks__ = {
    mockFindOne,
    mockSave,
  };

  return Cart;
});

const Cart = require("../src/models/cart.model");
const { mockFindOne, mockSave } = Cart.__mocks__;

describe("DELETE /api/cart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =======================
        SUCCESS CASES
  ======================= */

  it("clears cart when cart exists", async () => {
    mockFindOne.mockResolvedValue({
      user: "user123",
      items: [
        { productId: "prod1", quantity: 2 },
        { productId: "prod2", quantity: 1 },
      ],
      save: mockSave,
    });

    const res = await request(app)
      .delete("/api/cart")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Cart cleared successfully");
    expect(res.body.cart.items).toEqual([]);
    expect(mockSave).toHaveBeenCalled();
  });

  it("creates empty cart if cart does not exist", async () => {
    mockFindOne.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/cart")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body.cart.items).toEqual([]);
    expect(mockSave).toHaveBeenCalled();
  });

  /* =======================
        AUTH CASES
  ======================= */

  it("401 when no token provided", async () => {
    const res = await request(app).delete("/api/cart");
    expect(res.status).toBe(401);
  });

  it("401 when token is invalid", async () => {
    const res = await request(app)
      .delete("/api/cart")
      .set("Authorization", "Bearer invalid");

    expect(res.status).toBe(401);
  });
});
