import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { auth } from '../firebase';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const [waitingForAuth, setWaitingForAuth] = useState(true);

  // Give Firebase auth time to restore state (especially after page reload)
  useEffect(() => {
    const timer = setTimeout(() => {
      setWaitingForAuth(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking auth or waiting for Firebase to restore
  if (loading || waitingForAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        Loading...
      </div>
    );
  }

  // If user exists in context, allow access
  if (user) {
    return children;
  }

  // If no user in context but Firebase has auth, allow access (context will catch up)
  // This handles the case where user just logged in but context hasn't updated yet
  if (auth.currentUser) {
    return children;
  }

  // No user at all, redirect to login
  return <Navigate to="/login" replace />;
};

export default PrivateRoute;
