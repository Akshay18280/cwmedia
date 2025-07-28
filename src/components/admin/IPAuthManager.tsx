import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, MapPin, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { ipAuthService } from '../../services/firebase/ip-auth.service';

interface IPAuthManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IPAuthManager({ isOpen, onClose }: IPAuthManagerProps) {
  const [config, setConfig] = useState({ enabled: false, allowedIPs: [] as string[] });
  const [newIP, setNewIP] = useState('');
  const [currentIP, setCurrentIP] = useState<string>('detecting...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      detectCurrentIP();
    }
  }, [isOpen]);

  const loadConfig = () => {
    const currentConfig = ipAuthService.getConfig();
    setConfig(currentConfig);
  };

  const detectCurrentIP = async () => {
    try {
      const ipCheck = await ipAuthService.checkIPAuth();
      setCurrentIP(ipCheck.userIP);
    } catch (error) {
      setCurrentIP('detection failed');
    }
  };

  const toggleIPAuth = async () => {
    try {
      setLoading(true);
      const newEnabled = !config.enabled;
      ipAuthService.updateConfig({ enabled: newEnabled });
      setConfig(prev => ({ ...prev, enabled: newEnabled }));
      toast.success(`IP Authentication ${newEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update IP authentication settings');
    } finally {
      setLoading(false);
    }
  };

  const addIP = () => {
    if (!newIP.trim()) {
      toast.error('Please enter an IP address');
      return;
    }

    // Basic IP validation
    const ipPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?|::1|([0-9a-f:]+::[0-9a-f]*))$/i;
    if (!ipPattern.test(newIP.trim())) {
      toast.error('Please enter a valid IP address or CIDR notation');
      return;
    }

    if (config.allowedIPs.includes(newIP.trim())) {
      toast.error('IP address already exists');
      return;
    }

    try {
      ipAuthService.addAllowedIP(newIP.trim());
      setConfig(prev => ({
        ...prev,
        allowedIPs: [...prev.allowedIPs, newIP.trim()]
      }));
      setNewIP('');
      toast.success('IP address added successfully');
    } catch (error) {
      toast.error('Failed to add IP address');
    }
  };

  const removeIP = (ip: string) => {
    try {
      ipAuthService.removeAllowedIP(ip);
      setConfig(prev => ({
        ...prev,
        allowedIPs: prev.allowedIPs.filter(allowedIP => allowedIP !== ip)
      }));
      toast.success('IP address removed successfully');
    } catch (error) {
      toast.error('Failed to remove IP address');
    }
  };

  const addCurrentIP = () => {
    if (currentIP && currentIP !== 'detecting...' && currentIP !== 'detection failed') {
      setNewIP(currentIP);
    }
  };

  const isCurrentIPAllowed = () => {
    if (currentIP === 'detecting...' || currentIP === 'detection failed') return false;
    return config.allowedIPs.some(allowedIP => {
      if (allowedIP.includes('/')) {
        // Simple CIDR check - for display purposes
        return allowedIP.split('/')[0] === currentIP.split('.').slice(0, 3).join('.');
      }
      return allowedIP === currentIP;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-high-contrast">IP Authentication Manager</h2>
            <p className="text-medium-contrast text-body-sm mt-1">
              Manage IP-based admin authentication settings
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-medium-contrast" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Status */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Your Current IP: {currentIP}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  {isCurrentIPAllowed() ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-700 dark:text-green-300 text-body-sm">
                        Your IP is authorized
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-amber-700 dark:text-amber-300 text-body-sm">
                        Your IP is not authorized
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {currentIP !== 'detecting...' && currentIP !== 'detection failed' && !isCurrentIPAllowed() && (
              <button
                onClick={addCurrentIP}
                className="mt-3 px-3 py-1 bg-blue-600 text-white text-body-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Current IP
              </button>
            )}
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-high-contrast">IP Authentication</h3>
              <p className="text-medium-contrast text-body-sm">
                Enable automatic admin login for authorized IP addresses
              </p>
            </div>
            <button
              onClick={toggleIPAuth}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                config.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  config.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Add New IP */}
          <div className="space-y-3">
            <h3 className="font-medium text-high-contrast">Add IP Address</h3>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                placeholder="Enter IP address or CIDR range (e.g., 192.168.1.100 or 192.168.1.0/24)"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-high-contrast placeholder-medium-contrast focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addIP()}
              />
              <button
                onClick={addIP}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
            <p className="text-body-sm text-medium-contrast">
              Supports exact IPs (192.168.1.100) and CIDR notation (192.168.1.0/24)
            </p>
          </div>

          {/* Allowed IPs List */}
          <div className="space-y-3">
            <h3 className="font-medium text-high-contrast">Authorized IP Addresses</h3>
            {config.allowedIPs.length === 0 ? (
              <div className="text-center py-8 text-medium-contrast">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No IP addresses configured</p>
                <p className="text-body-sm">Add IP addresses to enable automatic authentication</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {config.allowedIPs.map((ip, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-medium-contrast" />
                      <span className="font-mono text-high-contrast">{ip}</span>
                      {ip === currentIP && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeIP(ip)}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Remove IP address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                  Security Considerations
                </h4>
                <ul className="text-body-sm text-amber-800 dark:text-amber-200 space-y-1">
                  <li>• Use specific IP addresses or narrow CIDR ranges</li>
                  <li>• Regularly review and update authorized IPs</li>
                  <li>• Ensure your network is secure when using IP authentication</li>
                  <li>• IP authentication bypasses all other security checks</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-high-contrast rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 