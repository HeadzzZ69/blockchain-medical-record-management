import React from 'react';
import { Navigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { account, userRole, isConnecting } = useWeb3();

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  if (!account) {
    return <Navigate to="/connect" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If not registered yet, redirect to self-registration or connect
    if (userRole === 'none') {
      return <Navigate to="/register" replace />;
    }
    return <Navigate to={`/${userRole || 'connect'}`} replace />;
  }

  return children;
}
