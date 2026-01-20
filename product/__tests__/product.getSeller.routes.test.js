const request = require("supertest");
const express = require("express");

/* =======================
   MOCK AUTH MIDDLEWARE
======================= */
jest.mock("../src/middlewares/auth.middleware.js", () => {
  return () => (req, res, next) => {
    req.user = {
      id: "507f1f77bcf86cd799439011",
      role: "seller",
    };
    next();
  };
});

/* =======================
   MOCK PRODUCT MODEL (FIXED)
======================= */
jest.mock("../src/models/product.model.js", () => {
  const skipMock = jest.fn();
  const limitMock = jest.fn();

  return {
    __esModule: true,
    find: jest.fn(() => ({
      skip: skipMock.mockReturnThis(),
      limit: limitMock,
    })),
    __mocks__: {
      skipMock,
      limitMock,
    },
  };
});

const ProductModel = require("../src/models/product.model");
const { __mocks__ } = ProductModel;
const productRoutes = require("../src/routes/product.routes");

/* =======================
   TEST APP SETUP
======================= */
describe("GET /api/products/seller", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/", productRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* =======================
        TEST CASES
  ======================= */

  it("should return seller products with default pagination", async () => {
    __mocks__.limitMock.mockResolvedValue([
      { title: "Product 1" },
      { title: "Product 2" },
    ]);

    const res = await request(app).get("/seller");

    expect(res.status).toBe(200);
    expect(res.body.product.length).toBe(2);

    expect(ProductModel.find).toHaveBeenCalledWith({
      seller: "507f1f77bcf86cd799439011",
    });
    expect(__mocks__.skipMock).toHaveBeenCalledWith(0);
    expect(__mocks__.limitMock).toHaveBeenCalledWith(20);
  });

  it("should apply skip and limit from query params", async () => {
    __mocks__.limitMock.mockResolvedValue([{ title: "Paged Product" }]);

    const res = await request(app).get("/seller?skip=5&limit=10");

    expect(res.status).toBe(200);
    expect(__mocks__.skipMock).toHaveBeenCalledWith("5");
    expect(__mocks__.limitMock).toHaveBeenCalledWith(10);
  });

  it("should return empty array if seller has no products", async () => {
    __mocks__.limitMock.mockResolvedValue([]);

    const res = await request(app).get("/seller");

    expect(res.status).toBe(200);
    expect(res.body.product).toEqual([]);
  });

  it("should handle database error gracefully", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    ProductModel.find.mockImplementation(() => {
      throw new Error("Database error");
    });

    const res = await request(app).get("/seller");

    expect(res.status).toBe(500);

    console.error.mockRestore();
  });
});
