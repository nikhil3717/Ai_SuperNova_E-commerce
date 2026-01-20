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
const saveMock = jest.fn();

jest.mock("../src/models/product.model.js", () => ({
  findOne: jest.fn(),
}));

const ProductModel = require("../src/models/product.model");
const productRoutes = require("../src/routes/product.routes");

/* =======================
   TEST APP SETUP
======================= */
describe("PATCH /api/products/:id (updateProductById)", () => {
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

  it("should return 400 for invalid product id", async () => {
    const res = await request(app)
      .patch("/invalid-id")
      .send({ title: "New Title" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid product");
  });

  it("should return 404 if product not found", async () => {
    const productId = new mongoose.Types.ObjectId();

    ProductModel.findOne.mockResolvedValue(null);

    const res = await request(app)
      .patch(`/${productId}`)
      .send({ title: "New Title" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Product not found");
  });

  it("should return 403 if seller does not own the product", async () => {
    const productId = new mongoose.Types.ObjectId();

    ProductModel.findOne.mockResolvedValue({
      _id: productId,
      seller: new mongoose.Types.ObjectId("507f1f77bcf86cd799439099"),
    });

    const res = await request(app)
      .patch(`/${productId}`)
      .send({ title: "Hacked Title" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      "Forbidden: you can only update you product"
    );
  });

  it("should update allowed fields successfully", async () => {
    const productId = new mongoose.Types.ObjectId();

    const mockProduct = {
      _id: productId,
      title: "Old Title",
      description: "Old Description",
      price: { amount: 100, currency: "INR" },
      seller: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      save: saveMock.mockResolvedValue(true),
    };

    ProductModel.findOne.mockResolvedValue(mockProduct);

    const res = await request(app)
      .patch(`/${productId}`)
      .send({
        title: "Updated Title",
        description: "Updated Description",
        price: {
          amount: 200,
          currency: "INR",
        },
        ignoredField: "should not update",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("product updated");
    expect(mockProduct.title).toBe("Updated Title");
    expect(mockProduct.description).toBe("Updated Description");
    expect(mockProduct.price.amount).toBe(200);
    expect(saveMock).toHaveBeenCalled();
  });

  it("should ignore fields not in allowedUpdates", async () => {
    const productId = new mongoose.Types.ObjectId();

    const mockProduct = {
      _id: productId,
      title: "Original Title",
      seller: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      save: saveMock.mockResolvedValue(true),
    };

    ProductModel.findOne.mockResolvedValue(mockProduct);

    const res = await request(app)
      .patch(`/${productId}`)
      .send({
        randomField: "should be ignored",
      });

    expect(res.status).toBe(200);
    expect(mockProduct.randomField).toBeUndefined();
  });

  it("should handle database errors gracefully", async () => {
    const productId = new mongoose.Types.ObjectId();

    jest.spyOn(console, "error").mockImplementation(() => {});

    ProductModel.findOne.mockRejectedValue(
      new Error("Database error")
    );

    const res = await request(app)
      .patch(`/${productId}`)
      .send({ title: "New Title" });

    expect(res.status).toBe(500);

    console.error.mockRestore();
  });
});
