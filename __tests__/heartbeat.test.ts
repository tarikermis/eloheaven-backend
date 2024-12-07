import supertest from 'supertest';
import app from '../src/app';

describe('/v1/heartbeart', () => {
  const endpoint = '/v1/heartbeat';
  const request = supertest(app);

  it('should response with 200', async () => {
    const response = await request.get(endpoint).timeout(2000);
    expect(response.status).toBe(200);
  });
});
