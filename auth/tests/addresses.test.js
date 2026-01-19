const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

describe('Addresses API - /api/auth/users/me/addresses', () => {
  let user;
  let token;

  beforeEach(async () => {
    await User.deleteMany({});

    const hashedPassword = await bcrypt.hash('password123', 10);

    user = await User.create({
      username: 'addruser',
      email: 'addr@example.com',
      password: hashedPassword,
      fullName: { firstName: 'Addr', lastName: 'User' }
    });

    token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  });

  describe('GET /api/auth/users/me/addresses', () => {
    it('should return an empty list when user has no addresses', async () => {
      const res = await request(app).get('/api/auth/users/me/addresses').set('Cookie', [`token=${token}`]);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.addresses)).toBe(true);
      expect(res.body.addresses.length).toBe(0);
    });

    it('should return addresses and mark default address', async () => {
      // seed two addresses, mark the first as default via a controller-expected field `isDefault`
      // tests assume the API returns `isDefault` boolean on one address
      user.addresses = [
        { street: '123 Main St', city: 'Townsville', state: 'TS', zipCode: '123456', country: 'Country', phone: '9876543210' },
        { street: '456 Other St', city: 'City', state: 'CS', zipCode: '654321', country: 'Country', phone: '9876543211' }
      ];
      // mark first as default in DB to allow controller to reflect it back; some implementations may use a dedicated flag
      user.addresses[0].isDefault = true;
      await user.save();

      const res = await request(app).get('/api/auth/users/me/addresses').set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.addresses)).toBe(true);
      expect(res.body.addresses.length).toBe(2);

      const defaults = res.body.addresses.filter(a => a.isDefault === true);
      expect(defaults.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/auth/users/me/addresses', () => {
    it('should add a valid address (with pincode and phone) and return 201', async () => {
      const payload = {
        street: '789 New Ave',
        city: 'NewCity',
        state: 'NC',
        zipCode: '560001', // treated as pincode
        country: 'Country',
        phone: '9876543210' // validated as phone
      };

      const res = await request(app).post('/api/auth/users/me/addresses').set('Cookie', [`token=${token}`]).send(payload);

      expect([200, 201]).toContain(res.status);
      // API should return created address or full list
      expect(res.body.address || res.body.addresses).toBeDefined();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.addresses.length).toBe(1);
      expect(updatedUser.addresses[0].street).toBe(payload.street);
      // if phone is saved on address by implementation, assert it; if not, at least zipCode
      expect(updatedUser.addresses[0].zipCode).toBe(payload.zipCode);
    });

    it('should return 400 for invalid pincode (zipCode)', async () => {
      const payload = { street: '1', city: 'C', state: 'S', zipCode: '12', country: 'Country', phone: '9876543210' };
      const res = await request(app).post('/api/auth/users/me/addresses').set('Cookie', [`token=${token}`]).send(payload);
      expect(res.status).toBe(400);
      expect(res.body.errors || res.body.message).toBeDefined();
    });

    it('should return 400 for invalid phone number', async () => {
      const payload = { street: '1', city: 'C', state: 'S', zipCode: '560001', country: 'Country', phone: 'abc123' };
      const res = await request(app).post('/api/auth/users/me/addresses').set('Cookie', [`token=${token}`]).send(payload);
      expect(res.status).toBe(400);
      expect(res.body.errors || res.body.message).toBeDefined();
    });
  });

  describe('DELETE /api/auth/users/me/addresses/:addressId', () => {
    it('should delete an existing address and return 200', async () => {
      user.addresses = [{ street: 'To Delete', city: 'D', state: 'S', zipCode: '560001', country: 'Country', phone: '9876543210' }];
      await user.save();

      const addressId = user.addresses[0]._id;

      const res = await request(app).delete(`/api/auth/users/me/addresses/${addressId}`).set('Cookie', [`token=${token}`]);
      expect([200, 204]).toContain(res.status);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.addresses.length).toBe(0);
    });

    it('should return 404 when address does not exist', async () => {
      const fakeId = '604b0b2f4f1a2563f8f0f000';
      const res = await request(app).delete(`/api/auth/users/me/addresses/${fakeId}`).set('Cookie', [`token=${token}`]);
      expect(res.status).toBe(404);
    });
  });
});
