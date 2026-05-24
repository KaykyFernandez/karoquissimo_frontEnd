import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PrivateRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // If authenticated, render nested child routes. If not, redirect to /login.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
