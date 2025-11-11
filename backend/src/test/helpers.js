// Simple test helpers for mocking req/res/next
export const mockReq = (overrides = {}) => ({
  params: {},
  body: {},
  query: {},
  headers: {},
  cookies: {},
  userId: overrides.userId,
  user: overrides.user,
  ...overrides,
});

export const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => { res.statusCode = code; return res; };
  res.jsonData = null;
  res.json = (data) => { res.jsonData = data; return res; };
  return res;
};

export const mockNext = () => jest.fn();
