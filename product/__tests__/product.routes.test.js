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
   MOCK MULTER (IMPORTANT)
======================= */
jest.mock("multer", () => {
  const multer = () => ({
    array: () => (req, res, next) => {
      req.files = [];
      next();
    },
  });

  multer.memoryStorage = jest.fn(() => ({}));
  return multer;
});

/* =======================
   MOCK PRODUCT VALIDATOR
======================= */
jest.mock("../src/middlewares/product.validators.js", () => ({
  createProductValidation: (req, res, next) => next(),
}));

/* =======================
   MOCK IMAGEKIT SERVICE
======================= */
jest.mock("../src/service/imagekit.service.js", () => ({
  uploadImage: jest.fn().mockResolvedValue({
    url: "https://fake.imagekit.io/image.jpg",
    thumbnailUrl: "https://fake.imagekit.io/thumb.jpg",
    fileId: "fake-file-id",
  }),
}));

/* =======================
   MOCK PRODUCT MODEL
======================= */
jest.mock("../src/models/product.model.js", () => ({
  create: jest.fn(),
}));

const Product = require("../src/models/product.model");
const productRoutes = require("../src/routes/product.routes");

/* =======================
   TEST APP SETUP
======================= */
describe("POST /api/products", () => {
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

  it("should create a product successfully", async () => {
    Product.create.mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      title: "Test Product",
    });

    const res = await request(app)
      .post("/")
      .send({
        title: "Test Product",
        description: "Test Description",
        priceAmount: 100,
        priceCurrency: "INR",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("_id");
  });

  it("should fail if title is missing", async () => {
    const res = await request(app)
      .post("/")
      .send({
        description: "Test Description",
        priceAmount: 100,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should fail if priceAmount is missing", async () => {
    const res = await request(app)
      .post("/")
      .send({
        title: "Test Product",
        description: "Test Description",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should handle database errors", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  
    Product.create.mockRejectedValue(new Error("Database error"));
  
    const res = await request(app)
      .post("/")
      .send({
        title: "Test Product",
        description: "Test Description",
        priceAmount: 100,
      });
  
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  
    console.error.mockRestore();
  });
  
});









