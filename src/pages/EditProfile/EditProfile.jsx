import LoadingSpinner from '../../components/LoadingSpinner';
import {t} from '../../utils/text'
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './EditProfile.css';

export default function EditProfile() {
  const { user, token, updateUser, login, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const imageReadVersion = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setImagePreview(user.image || null);
    }
  }, [user, authLoading, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if(!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size>4*1024*1024){setErrorMessage('Choose a JPG, PNG, or WebP image up to 4 MB.');return;}
    setRemoveImage(false);
    setImageFile(file);
    const version = ++imageReadVersion.current;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (version === imageReadVersion.current) setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    imageReadVersion.current += 1;
    setRemoveImage(true);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (password && password.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (password && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phone.trim());

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (removeImage) {
        formData.append('removeImage', 'true');
      }

      if (password) {
        formData.append('password', password);
      }

      const res = await authAPI.updateProfile(formData, token);

      if (res.success && res.user) {
        if(res.token)login(res.user,res.token);else updateUser(res.user);
        setImageFile(null);
        setRemoveImage(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSuccessMessage('Profile updated successfully!');
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMessage('Error connecting to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="edit-profile-container">
        <div className="edit-profile-card">
          <LoadingSpinner label="Loading profile..." className="loading-block" />
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-card">
        {/* Header */}
        <div className="edit-profile-header">
          <h1 className="edit-profile-title">{t("Edit Profile")}</h1>
          <p className="edit-profile-subtitle">{t("Update your personal information and photo")}</p>
        </div>

        {/* Feedback alerts */}
        {successMessage && (
          <div className="profile-alert success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#34d399" strokeWidth="2" />
              <path d="M8 12l3 3 5-5" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{t(successMessage)}</span>
          </div>
        )}

        {errorMessage && (
          <div className="profile-alert error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{t(errorMessage)}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-profile-form">
          {/* Avatar upload section */}
          <div className="avatar-section">
            <div className="avatar-wrapper" onClick={() => !isLoading && fileInputRef.current?.click()}>
              {imagePreview ? (
                <img src={imagePreview} alt="User Avatar" className="avatar-img" />
              ) : (
                <div className="avatar-fallback">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="avatar-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
              disabled={isLoading}
            />

            <div className="avatar-actions">
              <button
                type="button"
                className="btn-change-photo"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
              >{t("Change Photo")}</button>
              {imagePreview && (
                <button
                  type="button"
                  className="btn-remove-photo"
                  disabled={isLoading}
                  onClick={handleRemoveImage}
                >{t("Remove")}</button>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="fields-grid">
            {/* Email (DISABLED / READ ONLY) */}
            <div className="form-group">
              <div className="label-row">
                <label className="form-label">{t("Email Address")}</label>
                <span className="locked-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" />
                  </svg>{t("Locked")}</span>
              </div>
              <div className="input-box disabled">
                <input
                  type="email"
                  value={user.email}
                  disabled
                  readOnly
                  className="form-input disabled-input"
                />
              </div>
              <span className="field-hint">{t("Email address cannot be changed for security reasons.")}</span>
            </div>

            {/* Full Name */}
            <div className="form-group">
              <label className="form-label">{t("Full Name *")}</label>
              <div className="input-box">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("Your full name")}
                  required
                  className="form-input"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label className="form-label">{t("Phone Number")}</label>
              <div className="input-box">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="form-input"
                />
              </div>
            </div>

            {/* Change Password (Optional) */}
            <div className="form-group">
              <label className="form-label">{t("New Password (Optional)")}</label>
              <div className="input-box">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("Leave blank to keep current password")}
                  className="form-input"
                />
              </div>
            </div>

            {password && (
              <div className="form-group">
                <label className="form-label">{t("Confirm New Password")}</label>
                <div className="input-box">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("Repeat new password")}
                    className="form-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/')}
            >{t("Cancel")}</button>
            <button
              type="submit"
              className="btn-save"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="btn-loading">
                  <span className="spinner-sm" />{t("Saving...")}</span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
