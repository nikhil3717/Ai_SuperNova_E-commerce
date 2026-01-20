const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");

/* =======================
   MOCK PRODUCT MODEL
======================= */
jest.mock("../src/models/product.model.js", () => ({
  findById: jest.fn(),
}));

const ProductModel = require("../src/models/product.model");
const productRoutes = require("../src/routes/product.routes");

/* =======================
   TEST APP SETUP
======================= */
describe("GET /api/products/:id", () => {
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

  it("should return product by id", async () => {
    const productId = new mongoose.Types.ObjectId();

    ProductModel.findById.mockResolvedValue({
      _id: productId,
      title: "Test Product",
      price: { amount: 100, currency: "INR" },
    });

    const res = await request(app).get(`/${productId}`);

    expect(res.status).toBe(200);
    expect(res.body.product).toBeDefined();
    expect(res.body.product._id.toString()).toBe(productId.toString());
  });

  it("should return 404 if product not found", async () => {
    const productId = new mongoose.Types.ObjectId();

    ProductModel.findById.mockResolvedValue(null);

    const res = await request(app).get(`/${productId}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("product not found");
  });

  it("should handle invalid product id format", async () => {
    ProductModel.findById.mockRejectedValue(
      new Error("Cast to ObjectId failed")
    );

    const res = await request(app).get("/invalid-id");

    expect(res.status).toBe(500);
  });
});
