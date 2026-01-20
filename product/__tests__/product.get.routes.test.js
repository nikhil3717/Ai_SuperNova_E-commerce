const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");

/* =======================
   MOCK PRODUCT MODEL
======================= */
jest.mock("../src/models/product.model.js", () => ({
  find: jest.fn(),
}));

const ProductModel = require("../src/models/product.model");
const productRoutes = require("../src/routes/product.routes");

/* =======================
   TEST APP SETUP
======================= */
describe("GET /api/products", () => {
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

  it("should return products without filters", async () => {
    const mockProducts = [
      { _id: new mongoose.Types.ObjectId(), title: "Product 1" },
      { _id: new mongoose.Types.ObjectId(), title: "Product 2" },
    ];

    ProductModel.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockProducts),
    });

    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it("should apply text search filter", async () => {
    ProductModel.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });

    await request(app).get("/").query({ q: "iphone" });

    expect(ProductModel.find).toHaveBeenCalledWith({
      $text: { $search: "iphone" },
    });
  });

  it("should apply minprice filter", async () => {
    ProductModel.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });

    await request(app).get("/").query({ minprice: 100 });

    expect(ProductModel.find).toHaveBeenCalledWith({
      "price.amount": { $gte: 100 },
    });
  });

  it("should apply maxprice filter", async () => {
    ProductModel.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });

    await request(app).get("/").query({ maxprice: 500 });

    expect(ProductModel.find).toHaveBeenCalledWith({
      "price.amount": { $lte: 500 },
    });
  });

  it("should apply minprice + maxprice together", async () => {
    ProductModel.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });

    await request(app)
      .get("/")
      .query({ minprice: 100, maxprice: 500 });

    expect(ProductModel.find).toHaveBeenCalledWith({
      "price.amount": {
        $gte: 100,
        $lte: 500,
      },
    });
  });

  it("should apply pagination (skip & limit)", async () => {
    const skipMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockResolvedValue([]);

    ProductModel.find.mockReturnValue({
      skip: skipMock,
      limit: limitMock,
    });

    await request(app)
      .get("/")
      .query({ skip: 10, limit: 5 });

    expect(skipMock).toHaveBeenCalledWith(10);
    expect(limitMock).toHaveBeenCalledWith(5);
  });
});
