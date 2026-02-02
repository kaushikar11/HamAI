import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { ChevronLeft } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || auth.currentUser?.displayName || '');
  const [savingName, setSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const email = auth.currentUser?.email || user?.email || '';

  const handleSaveName = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Name cannot be empty');
      return;
    }
    setSavingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      const response = await api.post('/auth/set-name', { name: trimmed });
      if (response.data?.user) setUser(response.data.user);
      toast.success('Profile updated');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!currentPassword) {
      toast.error('Enter your current password');
      return;
    }
    setChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password') toast.error('Current password is incorrect');
      else if (err.code === 'auth/weak-password') toast.error('New password is too weak');
      else toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="profile-page">
      <nav className="profile-nav">
        <button type="button" className="profile-back" onClick={() => navigate('/dashboard')}>
          <ChevronLeft size={20} /> Back
        </button>
      </nav>
      <div className="profile-content">
        <h1 className="profile-title">Profile</h1>

        <section className="profile-section">
          <h2>Personal information</h2>
          <form onSubmit={handleSaveName} className="profile-form">
            <label htmlFor="profile-name">Display name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="profile-input"
            />
            <label htmlFor="profile-email" className="profile-email-label">Email</label>
            <input
              id="profile-email"
              type="email"
              value={email}
              readOnly
              className="profile-input profile-input-readonly"
            />
            <button type="submit" className="profile-button primary" disabled={savingName}>
              {savingName ? 'Saving...' : 'Save name'}
            </button>
          </form>
        </section>

        <section className="profile-section">
          <h2>Change password</h2>
          <form onSubmit={handleChangePassword} className="profile-form">
            <label htmlFor="current-password">Current password</label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="profile-input"
              autoComplete="current-password"
            />
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="profile-input"
              autoComplete="new-password"
            />
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="profile-input"
              autoComplete="new-password"
            />
            <button type="submit" className="profile-button primary" disabled={changingPassword}>
              {changingPassword ? 'Updating...' : 'Change password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Profile;
