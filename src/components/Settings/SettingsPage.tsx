import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  User, 
  Shield, 
  Bell, 
  Monitor, 
  HardDrive
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DatabaseBackup from './DatabaseBackup';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'backup' | 'profile' | 'security' | 'notifications' | 'system'>('backup');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage system settings and preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('backup')}
              className={`${
                activeTab === 'backup'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
            >
              <Database className="h-5 w-5 mr-2" />
              Database Backup
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
            >
              <User className="h-5 w-5 mr-2" />
              Profile Settings
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
            >
              <Shield className="h-5 w-5 mr-2" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
            >
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`${
                activeTab === 'system'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
            >
              <Monitor className="h-5 w-5 mr-2" />
              System
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'backup' && (
            <DatabaseBackup />
          )}
          
          {activeTab === 'profile' && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Profile Settings</h3>
              <p className="mt-1 text-sm text-gray-500">
                Profile settings coming soon.
              </p>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Security Settings</h3>
              <p className="mt-1 text-sm text-gray-500">
                Security settings coming soon.
              </p>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Notification Settings</h3>
              <p className="mt-1 text-sm text-gray-500">
                Notification settings coming soon.
              </p>
            </div>
          )}
          
          {activeTab === 'system' && (
            <div className="text-center py-12">
              <Monitor className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">System Settings</h3>
              <p className="mt-1 text-sm text-gray-500">
                System settings coming soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;