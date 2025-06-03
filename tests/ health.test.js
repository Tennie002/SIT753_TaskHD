// If this file is in the project root:
//   Webpage_SIT753/health.test.js
//
// OR if you prefer, move it into a folder named __tests__:
//   Webpage_SIT753/__tests__/health.test.js

const request = require('supertest');
const app = require('../index.js');

describe('GET /health', () => {
  it('responds with 200 and { status: "UP" }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'UP' });
  });
});
