const request = require('supertest');
const app = require('../src/app');
const { setupTestDatabase, clearDatabase, closeDb } = require('./testHelper');

describe('Multi-tenant User Isolation', () => {
  let user1Token, user1;
  let user2Token, user2;
  let user1LeadId;

  beforeAll(() => {
    setupTestDatabase();
  });

  beforeEach(async () => {
    clearDatabase();

    // Signup user 1
    const res1 = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'user1@test.com', password: 'Password123' });
    user1Token = res1.body.token;
    user1 = res1.body.user;

    // Signup user 2
    const res2 = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'user2@test.com', password: 'Password123' });
    user2Token = res2.body.token;
    user2 = res2.body.user;

    // User 1 creates a lead
    const leadRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: "User1 Private Lead",
        email: "confidential@corp1.com",
        phone: "+1 555-0101",
        company: "User1 Industries",
        source: "Referral",
        status: "Qualified",
      });
    user1LeadId = leadRes.body.data.id;
  });

  afterAll(() => {
    closeDb();
  });

  it("should prevent User 2 from listing User 1's leads", async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it("should return 404 when User 2 attempts to view User 1's lead by ID", async () => {
    const res = await request(app)
      .get(`/api/leads/${user1LeadId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Lead not found');
  });

  it("should return 404 when User 2 attempts to edit User 1's lead", async () => {
    const res = await request(app)
      .put(`/api/leads/${user1LeadId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        name: "Malicious Edit by User 2",
        status: "Lost",
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Lead not found');

    // Confirm User 1's lead was NOT modified
    const checkRes = await request(app)
      .get(`/api/leads/${user1LeadId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(checkRes.status).toBe(200);
    expect(checkRes.body.data.name).toBe("User1 Private Lead");
    expect(checkRes.body.data.status).toBe("Qualified");
  });

  it("should return 404 when User 2 attempts to delete User 1's lead", async () => {
    const res = await request(app)
      .delete(`/api/leads/${user1LeadId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Lead not found');

    // Confirm lead still exists for User 1
    const checkRes = await request(app)
      .get(`/api/leads/${user1LeadId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(checkRes.status).toBe(200);
  });

  it("should allow User 2 to use the same lead email as User 1 (isolated per user_id)", async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        name: "User2 Same Email Lead",
        email: "confidential@corp1.com", // same email as user 1's lead
        phone: "+1 555-0202",
        company: "User2 Corp",
        source: "Website",
        status: "New",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("confidential@corp1.com");
  });

  it("should keep stats completely separated between users", async () => {
    // User 1 has 1 lead
    const stats1 = await request(app)
      .get('/api/leads/stats')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(stats1.body.total).toBe(1);
    expect(stats1.body.byStatus.Qualified).toBe(1);

    // User 2 has 0 leads
    const stats2 = await request(app)
      .get('/api/leads/stats')
      .set('Authorization', `Bearer ${user2Token}`);
    expect(stats2.body.total).toBe(0);
    expect(stats2.body.byStatus.Qualified).toBe(0);
  });
});
