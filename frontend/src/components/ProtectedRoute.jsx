import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUser } from '../services/authService';

/**
 * Wraps routes that require auth (and optionally a specific role).
 * - unauthenticated  → /login
 * - wrong role       → /unauthorized
 */
const ProtectedRoute = ({ children, requiredRole }) => {
    const location = useLocation();

    if (!isAuthenticated()) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole) {
        const user = getUser();
        if (user?.role !== requiredRole) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
