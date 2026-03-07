/**
 * Thin wrapper around localStorage for auth state.
 * Keeps token + user in sync.
 */

const TOKEN_KEY = 'eduguide_token';
const USER_KEY  = 'eduguide_user';

export const saveAuth = ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
        return null;
    }
};

export const isAuthenticated = () => !!getToken();

export const isAdmin = () => getUser()?.role === 'admin';
