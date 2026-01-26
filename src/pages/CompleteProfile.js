import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const CompleteProfile = () => {
  const [formData, setFormData] = useState({ name: '', dateOfBirth: '' });
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.dateOfBirth) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/complete-profile', formData);
      
      setUser(response.data.user);
      toast.success('Profile completed!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <User size={48} className="auth-icon" />
          <h1>Complete Your Profile</h1>
          <p>We need a few more details</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Your full name"
            />
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
