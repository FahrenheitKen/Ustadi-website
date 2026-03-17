'use client';

import { useEffect, useState } from 'react';
import { Save, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

interface Settings {
  site_name: string;
  contact_email: string;
  mpesa_env: 'sandbox' | 'production';
  mpesa_business_short_code: string;
  mpesa_callback_url: string;
  mpesa_consumer_key_set: boolean;
  mpesa_consumer_secret_set: boolean;
  mpesa_passkey_set: boolean;
}

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Site settings
  const [siteName, setSiteName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // M-Pesa settings
  const [mpesaEnv, setMpesaEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [shortCode, setShortCode] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [passkey, setPasskey] = useState('');

  // Visibility toggles
  const [showConsumerKey, setShowConsumerKey] = useState(false);
  const [showConsumerSecret, setShowConsumerSecret] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);

  // Track which credentials are already set
  const [credentialsSet, setCredentialsSet] = useState({
    consumer_key: false,
    consumer_secret: false,
    passkey: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.getAdminSettings();
        if (response.success) {
          const s = response.settings;
          setSiteName(s.site_name);
          setContactEmail(s.contact_email);
          setMpesaEnv(s.mpesa_env);
          setShortCode(s.mpesa_business_short_code);
          setCallbackUrl(s.mpesa_callback_url);
          setCredentialsSet({
            consumer_key: s.mpesa_consumer_key_set,
            consumer_secret: s.mpesa_consumer_secret_set,
            passkey: s.mpesa_passkey_set,
          });
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const updates: any = {
        site_name: siteName,
        contact_email: contactEmail,
        mpesa_env: mpesaEnv,
        mpesa_business_short_code: shortCode,
      };

      // Only send credentials if they've been changed
      if (consumerKey) updates.mpesa_consumer_key = consumerKey;
      if (consumerSecret) updates.mpesa_consumer_secret = consumerSecret;
      if (passkey) updates.mpesa_passkey = passkey;

      const response = await api.updateAdminSettings(updates);
      if (response.success) {
        setSuccess('Settings saved successfully');
        // Clear credential fields after save
        setConsumerKey('');
        setConsumerSecret('');
        setPasskey('');
        // Update credentials set status
        if (consumerKey) setCredentialsSet((prev) => ({ ...prev, consumer_key: true }));
        if (consumerSecret) setCredentialsSet((prev) => ({ ...prev, consumer_secret: true }));
        if (passkey) setCredentialsSet((prev) => ({ ...prev, passkey: true }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure your platform settings</p>
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-900/50 border border-green-800 rounded-lg text-green-400 flex items-center gap-2">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Site Settings */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold text-white">Site Settings</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Site Name
            </label>
            <Input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Contact Email
            </label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        {/* M-Pesa Settings */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">M-Pesa Configuration</h2>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                mpesaEnv === 'production'
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-yellow-900/50 text-yellow-400'
              }`}
            >
              {mpesaEnv === 'production' ? 'Production' : 'Sandbox'}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Environment
            </label>
            <select
              value={mpesaEnv}
              onChange={(e) => setMpesaEnv(e.target.value as 'sandbox' | 'production')}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="production">Production (Live)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Use sandbox for testing, production for real payments
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Business Short Code
            </label>
            <Input
              type="text"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
              placeholder="174379"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Callback URL
            </label>
            <Input
              type="text"
              value={callbackUrl}
              disabled
              className="bg-gray-800 border-gray-700 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-generated. Register this URL in your Daraja portal.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Consumer Key
              {credentialsSet.consumer_key && (
                <span className="ml-2 text-green-500 text-xs">(Set)</span>
              )}
            </label>
            <div className="relative">
              <Input
                type={showConsumerKey ? 'text' : 'password'}
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
                placeholder={credentialsSet.consumer_key ? '••••••••••••••••' : 'Enter consumer key'}
                className="bg-gray-800 border-gray-700 text-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConsumerKey(!showConsumerKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showConsumerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Consumer Secret
              {credentialsSet.consumer_secret && (
                <span className="ml-2 text-green-500 text-xs">(Set)</span>
              )}
            </label>
            <div className="relative">
              <Input
                type={showConsumerSecret ? 'text' : 'password'}
                value={consumerSecret}
                onChange={(e) => setConsumerSecret(e.target.value)}
                placeholder={credentialsSet.consumer_secret ? '••••••••••••••••' : 'Enter consumer secret'}
                className="bg-gray-800 border-gray-700 text-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConsumerSecret(!showConsumerSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showConsumerSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Passkey
              {credentialsSet.passkey && (
                <span className="ml-2 text-green-500 text-xs">(Set)</span>
              )}
            </label>
            <div className="relative">
              <Input
                type={showPasskey ? 'text' : 'password'}
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder={credentialsSet.passkey ? '••••••••••••••••' : 'Enter passkey'}
                className="bg-gray-800 border-gray-700 text-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasskey(!showPasskey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
            <p className="text-yellow-400 text-sm">
              <strong>Security Note:</strong> Credentials are stored encrypted. Leave fields empty to keep existing values.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSaving ? (
              <Spinner size="sm" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
