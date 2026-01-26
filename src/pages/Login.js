import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';
import { auth } from '../firebase';
import ThemeToggle from '../components/ThemeToggle';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user || auth.currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(formData.email, formData.password);
    // Navigation is handled automatically in AuthContext
    setLoading(false);
  };

  return (
    <div className="auth-container login-split">
      {/* Left Side - Branding */}
      <div className="auth-branding">
        <div className="branding-content">
          <div className="logo-container">
            <img 
              src="/hamai-logo.png" 
              alt="HamAI Logo" 
              className="hamai-logo"
              onError={(e) => {
                // Fallback if image doesn't exist
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="logo-fallback" style={{ display: 'none' }}>
              <Sparkles size={64} className="logo-icon" />
            </div>
            <h1 className="brand-title">HamAI</h1>
          </div>
          
          <div className="brand-features">
            <div className="feature-item">
              <Zap className="feature-icon" />
              <p>AI-Powered Budget Management</p>
            </div>
            <div className="feature-item">
              <TrendingUp className="feature-icon" />
              <p>Smart Expense Tracking & Insights</p>
            </div>
            <div className="feature-item">
              <Shield className="feature-icon" />
              <p>Secure & Private Financial Data</p>
            </div>
          </div>
          
          <div className="brand-tagline">
            <p>Your intelligent companion for smarter spending decisions</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="auth-form-wrapper">
        <div className="auth-card">
          <div className="auth-theme-toggle">
            <ThemeToggle />
          </div>
          <div className="auth-header">
            <LogIn size={48} className="auth-icon" />
            <h1>Welcome Back</h1>
            <p>Sign in to your HamAI account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="your@email.com"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="auth-footer">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
