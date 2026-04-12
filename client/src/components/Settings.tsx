import React, { useState, useEffect } from 'react';
import ThemeSelector from './ThemeSelector';

interface Settings {
  emailNotifications: boolean;
  defaultJobStatus: string;
  loggingLevel: string;
  retentionPeriod: number;
  smtpServer: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
}

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Settings>({
    emailNotifications: true,
    defaultJobStatus: 'active',
    loggingLevel: 'info',
    retentionPeriod: 30,
    smtpServer: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/settings');
      if (response.ok) {
        const data = await response.json();
        setFormData({ ...formData, ...data });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Settings saved successfully');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      alert('Failed to save settings');
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 
        className="text-2xl font-bold mb-6"
        style={{ color: 'var(--color-text)' }}
      >
        Application Settings
      </h1>
      
      <form onSubmit={handleSave} className="space-y-6">
        {/* Theme Settings */}
        <div 
          className="p-6 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--color-surface)', 
            borderColor: 'var(--color-border)' 
          }}
        >
          <h2 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Appearance
          </h2>
          
          <div className="max-w-xs">
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text)' }}
            >
              Theme
            </label>
            <ThemeSelector showPreview={true} />
          </div>
        </div>

        {/* Application Settings */}
        <div 
          className="p-6 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--color-surface)', 
            borderColor: 'var(--color-border)' 
          }}
        >
          <h2 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Application Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                  className="rounded"
                />
                <span 
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text)' }}
                >
                  Email Notifications
                </span>
              </label>
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                Default Job Status
              </label>
              <select
                value={formData.defaultJobStatus}
                onChange={(e) => setFormData({ ...formData, defaultJobStatus: e.target.value })}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 form-input"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                Logging Level
              </label>
              <select
                value={formData.loggingLevel}
                onChange={(e) => setFormData({ ...formData, loggingLevel: e.target.value })}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 form-input"
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                Log Retention Period (days)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={formData.retentionPeriod}
                onChange={(e) => setFormData({ ...formData, retentionPeriod: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 form-input"
              />
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div 
          className="p-6 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--color-surface)', 
            borderColor: 'var(--color-border)' 
          }}
        >
          <h2 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Email Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                SMTP Server
              </label>
              <input
                type="text"
                required
                value={formData.smtpServer}
                onChange={(e) => setFormData({ ...formData, smtpServer: e.target.value })}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 form-input"
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                SMTP Port
              </label>
              <input
                type="number"
                min={1}
                max={65535}
                required
                value={formData.smtpPort}
                onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) || 587 })}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 form-input"
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                SMTP Username
              </label>
              <input
                type="text"
                required
                value={formData.smtpUsername}
                onChange={(e) => setFormData({ ...formData, smtpUsername: e.target.value })}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 form-input"
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                SMTP Password
              </label>
              <input
                type="password"
                required
                value={formData.smtpPassword}
                onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 form-input"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings; 