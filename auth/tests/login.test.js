
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const bcrypt = require('bcryptjs');

describe('POST /api/auth/login', () => {

    beforeEach(async () => {
      await User.deleteMany({});
    });

    it('should login user successfully with correct credentials', async () => {
      // First create a user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        fullName: {
          firstName: 'John',
          lastName: 'Doe'
        }
      });

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user.username).toBe('testuser');
    });

    it('should return 400 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for invalid password', async () => {
      // First create a user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        fullName: {
          firstName: 'John',
          lastName: 'Doe'
        }
      });

      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for missing email', async () => {
      const loginData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for missing password', async () => {
      const loginData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

  });
