import axios from 'axios';
import { API_URL } from '../../config';
import authService from '../../services/authService';

// Mock axios
jest.mock('axios');

describe('Auth Service', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn(key => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      })
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('login', () => {
    test('should call API with correct parameters and store token', async () => {
      // Arrange
      const mockResponse = {
        data: {
          token: 'test-token',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com'
          },
          message: 'Přihlášení úspěšné.'
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      // Act
      const result = await authService.login('testuser', 'password123');

      // Assert
      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/auth/login`,
        {
          usernameOrEmail: 'testuser',
          password: 'password123'
        }
      );

      expect(localStorageMock.setItem).toHaveBeenCalledWith('userToken', 'test-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'userInfo',
        JSON.stringify({
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    test('should throw error when API call fails', async () => {
      // Arrange
      const errorResponse = {
        response: {
          data: {
            message: 'Neplatné přihlašovací údaje'
          },
          status: 401
        }
      };

      axios.post.mockRejectedValue(errorResponse);

      // Act & Assert
      await expect(authService.login('testuser', 'wrongpassword')).rejects.toEqual(
        errorResponse.response.data
      );

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    test('should remove user data from localStorage', () => {
      // Arrange
      localStorageMock.setItem('userToken', 'test-token');
      localStorageMock.setItem('userInfo', JSON.stringify({ id: 1, username: 'testuser' }));

      // Act
      authService.logout();

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userInfo');
    });
  });

  describe('getCurrentUser', () => {
    test('should return user from localStorage if exists', () => {
      // Arrange
      const mockUser = { id: 1, username: 'testuser' };
      const mockToken = 'test-token';
      localStorageMock.setItem('userInfo', JSON.stringify(mockUser));
      localStorageMock.setItem('userToken', mockToken);

      // Act
      const result = authService.getCurrentUser();

      // Assert
      // Ověříme, že getItem byl zavolán se správným klíčem
      expect(localStorageMock.getItem).toHaveBeenCalledWith('userInfo');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('userToken');
      // Porovnáme výsledek s očekávanou hodnotou
      expect(result).toEqual({ token: mockToken, user: mockUser });
    });

    test('should return null if user not in localStorage', () => {
      // Act
      const result = authService.getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('userInfo');
    });
  });
});
