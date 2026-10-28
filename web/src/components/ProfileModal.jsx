import { X, User, Shield, LogOut } from 'lucide-react';
import { getUser, clearAuth } from '../lib/auth.js';

export function ProfileModal({ open, onClose, onLogout }) {
  if (!open) return null;
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    onLogout();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal__header">
          <h2>Profile</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="profile-modal__body">
          <div className="profile-avatar">
            <User size={48} />
          </div>
          <div className="profile-info">
            <div className="profile-row">
              <span className="profile-label">Username</span>
              <span className="profile-value">{user?.username || 'Unknown'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Role</span>
              <span className="profile-value profile-role">
                <Shield size={14} />
                {user?.role || 'User'}
              </span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Access Level</span>
              <span className="profile-value">{user?.role === 'admin' ? 'Full Authority' : 'Operator'}</span>
            </div>
          </div>
        </div>
        <div className="profile-modal__footer">
          <button className="profile-logout" onClick={handleLogout}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
