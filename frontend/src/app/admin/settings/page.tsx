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
  mpesa_enabled: boolean;
  paystack_enabled: boolean;
  mpesa_env: 'sandbox' | 'production';
  mpesa_business_short_code: string;
  mpesa_callback_url: string;
  mpesa_consumer_key_set: boolean;
  mpesa_consumer_secret_set: boolean;
  mpesa_passkey_set: boolean;
  paystack_callback_url: string;
  paystack_webhook_url: string;
  paystack_public_key_set: boolean;
  paystack_secret_key_set: boolean;
}

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Site settings
  const [siteName, setSiteName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Gateway toggles
  const [mpesaEnabled, setMpesaEnabled] = useState(false);
  const [paystackEnabled, setPaystackEnabled] = useState(false);

  // M-Pesa settings
  const [mpesaEnv, setMpesaEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [shortCode, setShortCode] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [passkey, setPasskey] = useState('');

  // Paystack settings
  const [paystackPublicKey, setPaystackPublicKey] = useState('');
  const [paystackSecretKey, setPaystackSecretKey] = useState('');
  const [paystackCallbackUrl, setPaystackCallbackUrl] = useState('');
  const [paystackWebhookUrl, setPaystackWebhookUrl] = useState('');

  // Visibility toggles
  const [showConsumerKey, setShowConsumerKey] = useState(false);
  const [showConsumerSecret, setShowConsumerSecret] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [showPaystackPublicKey, setShowPaystackPublicKey] = useState(false);
  const [showPaystackSecretKey, setShowPaystackSecretKey] = useState(false);

  // Track which credentials are already set
  const [credentialsSet, setCredentialsSet] = useState({
    consumer_key: false,
    consumer_secret: false,
    passkey: false,
    paystack_public_key: false,
    paystack_secret_key: false,
  });

  // Test states
  const [testingMpesa, setTestingMpesa] = useState(false);
  const [testingPaystack, setTestingPaystack] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.getAdminSettings();
        if (response.success) {
          const s = response.settings;
          setSiteName(s.site_name);
          setContactEmail(s.contact_email);
          setMpesaEnabled(s.mpesa_enabled);
          setPaystackEnabled(s.paystack_enabled);
          setMpesaEnv(s.mpesa_env);
          setShortCode(s.mpesa_business_short_code);
          setCallbackUrl(s.mpesa_callback_url);
          setPaystackCallbackUrl(s.paystack_callback_url || '');
          setPaystackWebhookUrl(s.paystack_webhook_url || '');
          setCredentialsSet({
            consumer_key: s.mpesa_consumer_key_set,
            consumer_secret: s.mpesa_consumer_secret_set,
            passkey: s.mpesa_passkey_set,
            paystack_public_key: s.paystack_public_key_set,
            paystack_secret_key: s.paystack_secret_key_set,
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
        mpesa_enabled: mpesaEnabled,
        paystack_enabled: paystackEnabled,
        mpesa_env: mpesaEnv,
        mpesa_business_short_code: shortCode,
      };

      // Only send credentials if they've been changed
      if (consumerKey) updates.mpesa_consumer_key = consumerKey;
      if (consumerSecret) updates.mpesa_consumer_secret = consumerSecret;
      if (passkey) updates.mpesa_passkey = passkey;
      if (paystackPublicKey) updates.paystack_public_key = paystackPublicKey;
      if (paystackSecretKey) updates.paystack_secret_key = paystackSecretKey;
      if (paystackCallbackUrl) updates.paystack_callback_url = paystackCallbackUrl;
      if (paystackWebhookUrl) updates.paystack_webhook_url = paystackWebhookUrl;

      const response = await api.updateAdminSettings(updates);
      if (response.success) {
        setSuccess('Settings saved successfully');
        // Clear credential fields after save
        setConsumerKey('');
        setConsumerSecret('');
        setPasskey('');
        setPaystackPublicKey('');
        setPaystackSecretKey('');
        // Update credentials set status
        if (consumerKey) setCredentialsSet((prev) => ({ ...prev, consumer_key: true }));
        if (consumerSecret) setCredentialsSet((prev) => ({ ...prev, consumer_secret: true }));
        if (passkey) setCredentialsSet((prev) => ({ ...prev, passkey: true }));
        if (paystackPublicKey) setCredentialsSet((prev) => ({ ...prev, paystack_public_key: true }));
        if (paystackSecretKey) setCredentialsSet((prev) => ({ ...prev, paystack_secret_key: true }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPaystack = async () => {
    setTestingPaystack(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.testPaystack();
      if (response.success) {
        setSuccess(response.message);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Paystack test failed');
    } finally {
      setTestingPaystack(false);
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
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-900/50 border border-green-800 rounded-lg text-green-400 flex items-center gap-2">
          <Check className="w-5 h-5 flex-shrink-0" />
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

        {/* Payment Gateways Enable/Disable */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold text-white">Payment Gateways</h2>
          <p className="text-sm text-gray-400">
            Enable or disable payment methods available to customers
          </p>

          <div className="space-y-3">
            {/* M-Pesa Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">M-Pesa</h3>
                  <p className="text-gray-500 text-xs">Mobile money payments via Safaricom</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMpesaEnabled(!mpesaEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  mpesaEnabled ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    mpesaEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Paystack Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Paystack</h3>
                  <p className="text-gray-500 text-xs">Card, bank transfer, and mobile money</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaystackEnabled(!paystackEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  paystackEnabled ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    paystackEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {!mpesaEnabled && !paystackEnabled && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
              <p className="text-yellow-400 text-sm">
                No payment gateways are enabled. Customers will not be able to make payments.
              </p>
            </div>
          )}
        </div>

        {/* M-Pesa Settings */}
        <div className={`bg-gray-900/50 rounded-xl p-6 border border-white/10 space-y-4 ${!mpesaEnabled ? 'opacity-60' : ''}`}>
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

        {/* Paystack Settings */}
        <div className={`bg-gray-900/50 rounded-xl p-6 border border-white/10 space-y-4 ${!paystackEnabled ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Paystack Configuration</h2>
            <button
              type="button"
              onClick={handleTestPaystack}
              disabled={testingPaystack || !credentialsSet.paystack_secret_key}
              className="px-3 py-1 text-xs font-medium rounded bg-blue-900/50 text-blue-400 hover:bg-blue-900/70 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testingPaystack ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Public Key
              {credentialsSet.paystack_public_key && (
                <span className="ml-2 text-green-500 text-xs">(Set)</span>
              )}
            </label>
            <div className="relative">
              <Input
                type={showPaystackPublicKey ? 'text' : 'password'}
                value={paystackPublicKey}
                onChange={(e) => setPaystackPublicKey(e.target.value)}
                placeholder={credentialsSet.paystack_public_key ? '••••••••••••••••' : 'pk_test_xxxxxxxxxx'}
                className="bg-gray-800 border-gray-700 text-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPaystackPublicKey(!showPaystackPublicKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showPaystackPublicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Found in your Paystack Dashboard under Settings &gt; API Keys
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Secret Key
              {credentialsSet.paystack_secret_key && (
                <span className="ml-2 text-green-500 text-xs">(Set)</span>
              )}
            </label>
            <div className="relative">
              <Input
                type={showPaystackSecretKey ? 'text' : 'password'}
                value={paystackSecretKey}
                onChange={(e) => setPaystackSecretKey(e.target.value)}
                placeholder={credentialsSet.paystack_secret_key ? '••••••••••••••••' : 'sk_test_xxxxxxxxxx'}
                className="bg-gray-800 border-gray-700 text-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPaystackSecretKey(!showPaystackSecretKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showPaystackSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Callback URL
            </label>
            <Input
              type="url"
              value={paystackCallbackUrl}
              onChange={(e) => setPaystackCallbackUrl(e.target.value)}
              placeholder="https://yourdomain.com/payment/verify"
              className="bg-gray-800 border-gray-700 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL where users are redirected after payment (your frontend)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Webhook URL
            </label>
            <Input
              type="url"
              value={paystackWebhookUrl}
              onChange={(e) => setPaystackWebhookUrl(e.target.value)}
              placeholder="https://api.yourdomain.com/api/payments/paystack/webhook"
              className="bg-gray-800 border-gray-700 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Register this URL in your Paystack Dashboard under Settings &gt; Webhooks
            </p>
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
