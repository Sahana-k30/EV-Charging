import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.location?.address || '',
    city: user?.location?.city || '',
    state: user?.location?.state || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setEditMode(false);
        // Update user in context if needed
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="profile-container">
      <h1>My Profile</h1>
      
      {editMode ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Name</label>
            <input name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input name="address" value={formData.address} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>City</label>
            <input name="city" value={formData.city} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>State</label>
            <input name="state" value={formData.state} onChange={handleChange} />
          </div>
          <button type="submit" className="btn-primary">Save Changes</button>
          <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">Cancel</button>
        </form>
      ) : (
        <div className="profile-view">
          <div className="profile-info">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Phone:</strong> {user?.phoneNumber || 'Not set'}</p>
            <p><strong>Address:</strong> {user?.location?.address || 'Not set'}</p>
            <p><strong>City:</strong> {user?.location?.city || 'Not set'}</p>
            <p><strong>State:</strong> {user?.location?.state || 'Not set'}</p>
          </div>
          <div className="profile-actions">
            <button onClick={() => setEditMode(true)} className="btn-primary">Edit Profile</button>
            <button onClick={handleLogout} className="btn-danger">Logout</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
