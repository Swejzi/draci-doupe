import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

// Create a mock for useAuth hook
const mockUseAuth = jest.fn();

// Mock the AuthContext module
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Test component to render inside ProtectedRoute
const TestComponent = () => <div>Protected Content</div>;

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    // Reset mocks
    mockNavigate.mockReset();
    mockUseAuth.mockReset();
  });

  test('renders Outlet when user is authenticated', () => {
    // Set up the mock to return an authenticated user
    mockUseAuth.mockReturnValue({
      currentUser: { id: '1', username: 'testuser' },
      loading: false
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<TestComponent />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    // Since we're using Outlet, we need to check if the component is rendered
    expect(screen.queryByText('Protected Content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
