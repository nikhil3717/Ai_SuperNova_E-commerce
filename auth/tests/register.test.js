const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const bcrypt = require('bcryptjs');

describe('POST /api/auth/register', () => {

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should register a new user successfully', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      fullName: {
        firstName: 'John',
        lastName: 'Doe'
      }
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User registered successfully');

    const user = await User.findOne({ email: userData.email });
    expect(user).toBeTruthy();
    expect(user.username).toBe(userData.username);
    expect(user.fullName.firstName).toBe(userData.fullName.firstName);
    expect(user.fullName.lastName).toBe(userData.fullName.lastName);
  });

  it('should return 400 if user already exists', async () => {
    const userData = {
      username: 'existinguser',
      email: 'existing@example.com',
      password: 'password123',
      fullName: {
        firstName: 'Jane',
        lastName: 'Doe'
      }
    };

    await User.create({
      username: userData.username,
      email: userData.email,
      password: await bcrypt.hash(userData.password, 10),
      fullName: userData.fullName
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('User already exists');
  });


    });


