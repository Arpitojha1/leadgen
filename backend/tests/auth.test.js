const request = require('supertest');
const app = require('../src/app');
const { setupTestDatabase, clearDatabase, closeDb } = require('./testHelper');

describe('Auth API Endpoints', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  beforeEach(() => {
    clearDatabase();
  });

  afterAll(() => {
    closeDb();
  });

  describe('POST /api/auth/signup', () => {
    it('should successfully create a new user and return a JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'demo@test.com',
          password: 'Password123',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('demo@test.com');
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject signup with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'not-an-email',
          password: 'Password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details.some((d) => d.field === 'email')).toBe(true);
    });

    it('should reject signup with password less than 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d) => d.field === 'password')).toBe(true);
    });

    it('should return 409 Conflict when signing up with an existing email', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@test.com',
          password: 'Password123',
        });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@test.com',
          password: 'Password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('An account with this email already exists');
      expect(res.body.details.some((d) => d.field === 'email')).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'user@test.com',
          password: 'Password123',
        });
    });

    it('should authenticate user and return token on valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'Password123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('user@test.com');
    });

    it('should return 401 when password is incorrect', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should return 401 when user does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 when authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('missing or malformed');
    });

    it('should return user profile when authenticated with valid Bearer token', async () => {
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'authme@test.com',
          password: 'Password123',
        });

      const token = signupRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('authme@test.com');
    });
  });
});
