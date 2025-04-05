const authController = require('../../controllers/authController');
const db = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../../config/db');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        usernameOrEmail: 'testuser'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('register', () => {
    test('should return 400 if required fields are missing', async () => {
      // Arrange
      req.body = { username: 'testuser' }; // Missing email and password

      // Act
      await authController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Chybí uživatelské jméno, email nebo heslo')
      }));
    });

    test('should return 400 if username already exists', async () => {
      // Arrange
      db.query.mockResolvedValueOnce({ rows: [{ username: 'testuser' }] });

      // Act
      await authController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Uživatel s tímto uživatelským jménem již existuje')
      }));
    });

    test('should register user successfully', async () => {
      // Arrange
      db.query
        .mockResolvedValueOnce({ rows: [] }) // No existing user
        .mockResolvedValueOnce({ rows: [{ id: 1, username: 'testuser', email: 'test@example.com' }] }); // Inserted user

      bcrypt.hash.mockResolvedValue('hashedpassword');

      // Act
      await authController.register(req, res);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['testuser', 'test@example.com', 'hashedpassword'])
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Uživatel úspěšně zaregistrován.',
        user: expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        })
      }));
    });
  });

  describe('login', () => {
    test('should return 400 if required fields are missing', async () => {
      // Arrange
      req.body = { usernameOrEmail: 'testuser' }; // Missing password

      // Act
      await authController.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Chybí uživatelské jméno/email nebo heslo')
      }));
    });

    test('should return 401 if user not found', async () => {
      // Arrange
      db.query.mockResolvedValueOnce({ rows: [] }); // No user found

      // Act
      await authController.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Neplatné přihlašovací údaje')
      }));
    });

    test('should return 401 if password is incorrect', async () => {
      // Arrange
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password_hash: 'hashedpassword'
        }]
      });

      bcrypt.compare.mockResolvedValue(false); // Password doesn't match

      // Act
      await authController.login(req, res);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Neplatné přihlašovací údaje')
      }));
    });

    test('should login user successfully', async () => {
      // Arrange
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password_hash: 'hashedpassword'
        }]
      });

      bcrypt.compare.mockResolvedValue(true); // Password matches
      jwt.sign.mockReturnValue('token123');

      process.env.JWT_SECRET = 'testsecret';

      // Act
      await authController.login(req, res);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1, username: 'testuser' }),
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Přihlášení úspěšné.',
        token: 'token123',
        user: expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        })
      }));
    });
  });
});
