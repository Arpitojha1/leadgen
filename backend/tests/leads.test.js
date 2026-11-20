const request = require('supertest');
const app = require('../src/app');
const { setupTestDatabase, clearDatabase, closeDb } = require('./testHelper');

describe('Leads API Endpoints', () => {
  let token;
  let user;

  beforeAll(async () => {
    setupTestDatabase();
  });

  beforeEach(async () => {
    clearDatabase();

    // Register and login test user
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'leadmanager@test.com',
        password: 'Password123',
      });
    token = signupRes.body.token;
    user = signupRes.body.user;
  });

  afterAll(() => {
    closeDb();
  });

  describe('POST /api/leads (Create Lead)', () => {
    it('should create a lead with valid inputs and return 201', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Sarah Connor',
          email: 'sarah@cyberdyne.com',
          phone: '+1 555-0199',
          company: 'Cyberdyne Systems',
          source: 'Website',
          status: 'New',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Sarah Connor');
      expect(res.body.data.status).toBe('New');
      expect(res.body.data.source).toBe('Website');
    });

    it('should accept valid international and formatted phone numbers (7-15 digits)', async () => {
      const phones = [
        '+44 20 7946 0991',
        '1234567',
        '+1-800-555-0199',
        '987654321012345',
      ];

      for (let i = 0; i < phones.length; i++) {
        const res = await request(app)
          .post('/api/leads')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: `Test Lead ${i}`,
            email: `lead${i}@test.com`,
            phone: phones[i],
            company: 'Acme Corp',
            source: 'LinkedIn',
            status: 'Contacted',
          });

        expect(res.status).toBe(201);
      }
    });

    it('should reject invalid inputs with 400 and validation details', async () => {
      // 1. Missing / short name (< 2 chars)
      const res1 = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'A',
          email: 'valid@test.com',
          phone: '1234567',
          company: 'Corp',
          source: 'Website',
          status: 'New',
        });
      expect(res1.status).toBe(400);
      expect(res1.body.details.some((d) => d.field === 'name')).toBe(true);

      // 2. Bad email
      const res2 = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Alice Cooper',
          email: 'not-an-email',
          phone: '1234567',
          company: 'Corp',
          source: 'Website',
          status: 'New',
        });
      expect(res2.status).toBe(400);
      expect(res2.body.details.some((d) => d.field === 'email')).toBe(true);

      // 3. Short phone (< 7 digits)
      const res3 = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Alice Cooper',
          email: 'alice@test.com',
          phone: '12345',
          company: 'Corp',
          source: 'Website',
          status: 'New',
        });
      expect(res3.status).toBe(400);
      expect(res3.body.details.some((d) => d.field === 'phone')).toBe(true);

      // 4. Invalid source enum
      const res4 = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Alice Cooper',
          email: 'alice@test.com',
          phone: '12345678',
          company: 'Corp',
          source: 'InvalidSource',
          status: 'New',
        });
      expect(res4.status).toBe(400);
      expect(res4.body.details.some((d) => d.field === 'source')).toBe(true);

      // 5. Invalid status enum
      const res5 = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Alice Cooper',
          email: 'alice@test.com',
          phone: '12345678',
          company: 'Corp',
          source: 'Website',
          status: 'UnknownStatus',
        });
      expect(res5.status).toBe(400);
      expect(res5.body.details.some((d) => d.field === 'status')).toBe(true);
    });

    it('should reject duplicate email for the same user with 409 Conflict', async () => {
      await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'First Entry',
          email: 'unique@corp.com',
          phone: '1234567',
          company: 'Corp',
          source: 'Website',
          status: 'New',
        });

      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Duplicate Entry',
          email: 'unique@corp.com',
          phone: '7654321',
          company: 'Corp 2',
          source: 'Referral',
          status: 'Contacted',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists for your account');
    });
  });

  describe('GET /api/leads (List, Search, Filter, Sort, Paginate)', () => {
    beforeEach(async () => {
      // Seed 5 leads across different statuses and sources
      const leadsToSeed = [
        { name: 'Ann Marie', email: 'ann@tech.com', phone: '111-222-3333', company: 'Tech Corp', source: 'Website', status: 'Qualified' },
        { name: 'Bob Smith', email: 'bob@builder.com', phone: '222-333-4444', company: 'Build Inc', source: 'Referral', status: 'New' },
        { name: 'Charlie Ann Brown', email: 'charlie@peanuts.com', phone: '333-444-5555', company: 'Comic LLC', source: 'LinkedIn', status: 'Qualified' },
        { name: 'Diana Prince', email: 'diana@themyscira.com', phone: '444-555-6666', company: 'Justice Corp', source: 'Cold Call', status: 'Contacted' },
        { name: 'Evan Wright', email: 'evan@press.com', phone: '555-666-7777', company: 'Media Co', source: 'Event', status: 'Lost' },
      ];

      for (const lead of leadsToSeed) {
        await request(app)
          .post('/api/leads')
          .set('Authorization', `Bearer ${token}`)
          .send(lead);
      }
    });

    it('should list all leads for current user with default pagination', async () => {
      const res = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(5);
      expect(res.body.pagination.total).toBe(5);
      expect(res.body.pagination.page).toBe(1);
    });

    it('should search case-insensitively by name with partial match', async () => {
      const res = await request(app)
        .get('/api/leads?search=ann')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      const names = res.body.data.map((l) => l.name);
      expect(names).toContain('Ann Marie');
      expect(names).toContain('Charlie Ann Brown');
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/leads?status=Qualified')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.every((l) => l.status === 'Qualified')).toBe(true);
    });

    it('should support pagination (limit and page)', async () => {
      const resPage1 = await request(app)
        .get('/api/leads?limit=2&page=1&sortBy=name&order=asc')
        .set('Authorization', `Bearer ${token}`);

      expect(resPage1.status).toBe(200);
      expect(resPage1.body.data.length).toBe(2);
      expect(resPage1.body.pagination.totalPages).toBe(3);
      expect(resPage1.body.data[0].name).toBe('Ann Marie');
      expect(resPage1.body.data[1].name).toBe('Bob Smith');

      const resPage2 = await request(app)
        .get('/api/leads?limit=2&page=2&sortBy=name&order=asc')
        .set('Authorization', `Bearer ${token}`);

      expect(resPage2.status).toBe(200);
      expect(resPage2.body.data.length).toBe(2);
      expect(resPage2.body.data[0].name).toBe('Charlie Ann Brown');
      expect(resPage2.body.data[1].name).toBe('Diana Prince');
    });

    it('should sort safely using whitelist of sortable columns', async () => {
      const res = await request(app)
        .get('/api/leads?sortBy=name&order=desc')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].name).toBe('Evan Wright');
    });

    it('should reject invalid sort column with 400', async () => {
      const res = await request(app)
        .get('/api/leads?sortBy=malicious_sql_injection')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /api/leads/:id (Update Lead)', () => {
    let leadId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'John Connor',
          email: 'john@resistance.org',
          phone: '123-456-7890',
          company: 'Resistance',
          source: 'Website',
          status: 'New',
        });
      leadId = res.body.data.id;
    });

    it('should update lead status and details', async () => {
      const res = await request(app)
        .put(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'Qualified',
          company: 'Tech Resistance Global',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Qualified');
      expect(res.body.data.company).toBe('Tech Resistance Global');
      expect(res.body.data.name).toBe('John Connor');
    });

    it('should return 404 when updating non-existent lead', async () => {
      const res = await request(app)
        .put('/api/leads/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Lost' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Lead not found');
    });
  });

  describe('DELETE /api/leads/:id', () => {
    let leadId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Temporary Lead',
          email: 'temp@test.com',
          phone: '123-456-7890',
          company: 'Temp Co',
          source: 'Other',
          status: 'New',
        });
      leadId = res.body.data.id;
    });

    it('should delete lead and return 204 No Content, then 404 on re-fetch', async () => {
      const delRes = await request(app)
        .delete(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(delRes.status).toBe(204);

      // Re-fetch should return 404
      const fetchRes = await request(app)
        .get(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(fetchRes.status).toBe(404);
      expect(fetchRes.body.error).toBe('Lead not found');
    });

    it('should return 404 when deleting non-existent lead', async () => {
      const res = await request(app)
        .delete('/api/leads/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/leads/stats (Dashboard Stats)', () => {
    it('should return total leads and count grouped by status', async () => {
      const leads = [
        { name: 'Lead 1', email: 'l1@test.com', phone: '111-222-3333', company: 'C1', source: 'Website', status: 'New' },
        { name: 'Lead 2', email: 'l2@test.com', phone: '111-222-3334', company: 'C2', source: 'Referral', status: 'New' },
        { name: 'Lead 3', email: 'l3@test.com', phone: '111-222-3335', company: 'C3', source: 'LinkedIn', status: 'Contacted' },
        { name: 'Lead 4', email: 'l4@test.com', phone: '111-222-3336', company: 'C4', source: 'Cold Call', status: 'Qualified' },
        { name: 'Lead 5', email: 'l5@test.com', phone: '111-222-3337', company: 'C5', source: 'Other', status: 'Lost' },
      ];

      for (const l of leads) {
        await request(app)
          .post('/api/leads')
          .set('Authorization', `Bearer ${token}`)
          .send(l);
      }

      const res = await request(app)
        .get('/api/leads/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(5);
      expect(res.body.byStatus).toEqual({
        New: 2,
        Contacted: 1,
        Qualified: 1,
        Lost: 1,
      });
    });
  });
});
