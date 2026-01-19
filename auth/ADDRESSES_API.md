# Addresses API Routes

## Overview
Added complete address management APIs with validation and test coverage.

## API Endpoints

### 1. GET /api/auth/users/me/addresses
**Description**: List all saved addresses for the authenticated user, marking default address.

**Method**: GET  
**Authentication**: Required (JWT token via cookie)  
**Response**: 
```json
{
  "message": "User addresses fetched successfully",
  "addresses": [
    {
      "_id": "...",
      "street": "123 Main St",
      "city": "Townsville",
      "state": "TS",
      "zipCode": "123456",
      "country": "Country",
      "phone": "9876543210",
      "isDefault": true
    }
  ]
}
```

---

### 2. POST /api/auth/users/me/addresses
**Description**: Add a new address with validation for pincode (6 digits) and phone (10 digits).

**Method**: POST  
**Authentication**: Required (JWT token via cookie)  
**Request Body**:
```json
{
  "street": "789 New Ave",
  "city": "NewCity",
  "state": "NC",
  "zipCode": "560001",
  "country": "Country",
  "phone": "9876543210"
}
```

**Validation Rules**:
- `street`: Required string
- `city`: Required string
- `state`: Required string
- `country`: Required string
- `zipCode` (pincode): Required, must be exactly 6 digits
- `phone`: Required, must be exactly 10 digits

**Response (201 Created)**:
```json
{
  "message": "Address added successfully",
  "address": {
    "street": "789 New Ave",
    "city": "NewCity",
    "state": "NC",
    "zipCode": "560001",
    "country": "Country",
    "phone": "9876543210",
    "isDefault": true,
    "_id": "..."
  }
}
```

**Error (400 Bad Request)**:
```json
{
  "errors": [
    {
      "value": "12",
      "msg": "Pincode must be 6 digits",
      "param": "zipCode",
      "location": "body"
    }
  ]
}
```

---

### 3. DELETE /api/auth/users/me/addresses/:addressId
**Description**: Remove an address by its ID.

**Method**: DELETE  
**Authentication**: Required (JWT token via cookie)  
**URL Parameters**:
- `addressId`: MongoDB ObjectId of the address to delete

**Response (200 OK)**:
```json
{
  "message": "Address deleted successfully"
}
```

**Error (404 Not Found)**:
```json
{
  "message": "Address not found"
}
```

---

## Database Schema

### AddressSchema
```javascript
{
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  phone: String,
  isDefault: Boolean (default: false)
}
```

### User Model
Addresses stored as array in `user.addresses`: `[AddressSchema]`

---

## Implementation Details

### Files Modified:
1. **src/models/user.model.js** - Extended AddressSchema with phone and isDefault fields
2. **src/controllers/user.controller.js** - Added GetUserAddresses, addAddress, deleteAddress methods
3. **src/middleware/validation.middleware.js** - Added addAddressValidations with pincode/phone regex
4. **src/routes/auth.route.js** - Added GET, POST, DELETE routes for addresses
5. **tests/addresses.test.js** - Comprehensive test suite with 7 test cases

### Test Coverage:
- ✅ GET empty addresses list
- ✅ GET addresses with default marking
- ✅ POST valid address
- ✅ POST validation: invalid pincode
- ✅ POST validation: invalid phone
- ✅ DELETE existing address
- ✅ DELETE non-existent address (404)

---

## Features:
- First address added is automatically marked as default (`isDefault: true`)
- Phone and zipCode validation with regex patterns
- Full error handling with descriptive messages
- JWT authentication on all routes
- Proper HTTP status codes (201 for creation, 200 for success, 404 for not found, 400 for validation)
