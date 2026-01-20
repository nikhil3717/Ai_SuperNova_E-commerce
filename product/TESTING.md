# Jest Testing Setup for Product API

## Installation

Install dependencies:
```bash
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Project Structure

```
product/
├── src/
│   ├── routes/
│   │   ├── __tests__/
│   │   │   └── product.routes.test.js    # POST /api/products/ tests
│   │   └── product.routes.js
│   ├── models/
│   │   └── product.model.js
│   ├── db/
│   │   └── db.js
│   └── app.js
├── jest.config.js                         # Jest configuration
├── jest.setup.js                          # Environment setup
└── package.json
```

## Test Coverage

The test suite covers the following scenarios for `POST /api/products/`:

### 1. **Successful Product Creation**
   - Creates a product with valid data
   - Returns 201 status with created product data
   - Images are uploaded via ImageKit

### 2. **Input Validation**
   - Validates required fields (title, description, price, seller)
   - Returns 400 status with validation errors

### 3. **Image Handling with Multer**
   - Tests multipart form data with image files
   - Uploads images to ImageKit
   - Stores image URLs and thumbnails

### 4. **ImageKit Integration**
   - Handles ImageKit upload errors gracefully
   - Returns 500 status when upload fails

### 5. **Price Validation**
   - Validates currency enum (USD, INR)
   - Rejects invalid currency types

### 6. **Database Error Handling**
   - Handles MongoDB connection errors
   - Returns appropriate error responses

## Mocking Strategy

### Multer Mock
```javascript
jest.mock('multer');
```
The multer middleware is mocked to handle file uploads in tests.

### ImageKit Mock
```javascript
jest.mock('imagekit');
```
The ImageKit SDK is mocked to simulate image uploads without making real API calls.

### Product Model Mock
```javascript
jest.mock('../../models/product.model');
```
The Mongoose model is mocked to control database behavior during tests.

## Implementation Guide

To make the tests pass, implement the route handler in [src/routes/product.routes.js](src/routes/product.routes.js) with:

1. **Multer Configuration**
   ```javascript
   const multer = require('multer');
   const upload = multer({ storage: multer.memoryStorage() });
   ```

2. **ImageKit Configuration**
   ```javascript
   const ImageKit = require('imagekit');
   const imagekit = new ImageKit({
     publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
     privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
     urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
   });
   ```

3. **Route Handler**
   - Accept multipart/form-data with file uploads
   - Validate input data
   - Upload files to ImageKit
   - Save product to MongoDB
   - Return created product with image URLs

## Environment Variables

Create a `.env.test` file for testing:
```
MONGODB_URI=mongodb://localhost:27017/product-test
IMAGEKIT_PUBLIC_KEY=test_public_key
IMAGEKIT_PRIVATE_KEY=test_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/test/
```

These are automatically loaded by `jest.setup.js`.

## Dependencies

### Production
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `multer`: File upload middleware
- `imagekit`: Image upload service

### Development
- `jest`: Testing framework
- `supertest`: HTTP assertion library
- `jest-mock-extended`: Mock helpers

## Troubleshooting

### Tests failing due to missing mocks
Ensure all external dependencies are properly mocked before importing the route handler.

### ImageKit API errors
Check that environment variables are correctly set in `jest.setup.js`.

### Database connection errors
The test suite uses in-memory mocks instead of real MongoDB. For integration tests, consider using MongoDB Memory Server.
