const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');

const TEST_SECRET = 'goalsync_test_secret_key_12345';
process.env.JWT_SECRET = TEST_SECRET;

test('verifyToken: successfully verifies valid Bearer JWT and sets req.user', () => {
  const payload = {
    id: 'user_123',
    role: 'manager',
    name: 'Lakshya Nigam',
    department: 'Engineering',
    managerId: 'exec_001'
  };

  const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });
  let nextCalled = false;
  const req = {
    headers: {
      authorization: `Bearer ${token}`
    }
  };
  const res = {};
  const next = () => { nextCalled = true; };

  verifyToken(req, res, next);

  assert.equal(nextCalled, true, 'Next must be called on valid token');
  assert.equal(req.user.id, 'user_123');
  assert.equal(req.user.role, 'manager');
  assert.equal(req.user.department, 'Engineering');
});

test('verifyToken: returns 401 when Authorization header is missing', () => {
  let statusCode = 0;
  let jsonResponse = null;
  const req = { headers: {} };
  const res = {
    status(code) {
      statusCode = code;
      return {
        json(data) { jsonResponse = data; }
      };
    }
  };
  const next = () => {};

  verifyToken(req, res, next);
  assert.equal(statusCode, 401);
  assert.equal(jsonResponse.message, 'Unauthorized');
});

test('verifyToken: returns 401 on expired or tampered token', () => {
  let statusCode = 0;
  const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature';
  const req = {
    headers: {
      authorization: `Bearer ${invalidToken}`
    }
  };
  const res = {
    status(code) {
      statusCode = code;
      return {
        json() {}
      };
    }
  };

  verifyToken(req, res, () => {});
  assert.equal(statusCode, 401);
});
