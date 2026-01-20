const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");

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
   MOCK PRODUCT MODEL
======================= */
const deleteOneMock = jest.fn();

jest.mock("../src/models/product.model.js", () => ({
  findOne: jest.fn(),
}));

const ProductModel = require("../src/models/product.model");
const productRoutes = require("../src/routes/product.routes");

/* =======================
   TEST APP SETUP
======================= */
describe("DELETE /api/products/:id (SELLER)", () => {
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

  it("should delete product successfully", async () => {
    const productId = new mongoose.Types.ObjectId();

    ProductModel.findOne.mockResolvedValue({
      _id: productId,
      seller: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      deleteOne: deleteOneMock.mockResolvedValue(true),
    });

    const res = await request(app).delete(`/${productId}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("product deleted");
    expect(deleteOneMock).toHaveBeenCalled();
  });

  it("should return 400 for invalid product id", async () => {
    const res = await request(app)
      .delete("/invalid-id");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid product");
  });

  it("should return 404 if product not found", async () => {
    const productId = new mongoose.Types.ObjectId();

    ProductModel.findOne.mockResolvedValue(null);

    const res = await request(app).delete(`/${productId}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Product not found");
  });

  it("should return 403 if seller does not own product", async () => {
    const productId = new mongoose.Types.ObjectId();

    ProductModel.findOne.mockResolvedValue({
      _id: productId,
      seller: new mongoose.Types.ObjectId("507f1f77bcf86cd799439099"),
    });

    const res = await request(app).delete(`/${productId}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      "Forbidden: you can only delete your product"
    );
  });

  it("should handle database error gracefully", async () => {
    const productId = new mongoose.Types.ObjectId();

    jest.spyOn(console, "error").mockImplementation(() => {});

    ProductModel.findOne.mockRejectedValue(
      new Error("Database error")
    );

    const res = await request(app).delete(`/${productId}`);

    expect(res.status).toBe(500);

    console.error.mockRestore();
  });
});
