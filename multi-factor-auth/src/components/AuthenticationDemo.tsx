import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Key, UserPlus, Users } from 'lucide-react';
import {
  deriveKey,
  generateSalt,
  generateTOTPSecret,
  verifyTOTP,
  generateChallenge
} from '../utils/crypto';
import type { User, AuthenticationAttempt, AuthState } from '../types';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123'; // In production, use a secure password

const AuthenticationDemo: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    currentUser: null,
    attempts: []
  });
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'initial' | 'password' | 'totp' | 'complete'>('initial');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [challenge] = useState<string>(generateChallenge());

  useEffect(() => {
    // Initialize admin user if not exists
    if (!users.find(u => u.username === ADMIN_USERNAME)) {
      const salt = generateSalt();
      const adminUser: User = {
        id: 'admin',
        username: ADMIN_USERNAME,
        passwordHash: deriveKey(ADMIN_PASSWORD, salt),
        salt,
        isAdmin: true,
        registeredAt: Date.now(),
        totpSecret: generateTOTPSecret() // Ensure admin has TOTP secret
      };
      setUsers(prev => [...prev, adminUser]);
    }
  }, []);

  const handleRegister = () => {
    if (users.find(u => u.username === formData.username)) {
      alert('Username already exists');
      return;
    }

    const salt = generateSalt();
    const totpSecret = generateTOTPSecret();
    
    const newUser: User = {
      id: crypto.randomUUID(),
      username: formData.username,
      passwordHash: deriveKey(formData.password, salt),
      salt,
      totpSecret,
      isAdmin: false,
      registeredAt: Date.now()
    };

    setUsers(prev => [...prev, newUser]);
    setAuthState(prev => ({ ...prev, currentUser: newUser }));
    setStep('totp');
  };

  const handlePasswordAuth = () => {
    const user = users.find(u => u.username === formData.username);
    
    if (!user) {
      alert('User not registered. Please register first.');
      return false;
    }

    const attempt: AuthenticationAttempt = {
      timestamp: Date.now(),
      success: false,
      method: 'password',
      userId: user.id
    };

    const derivedKey = deriveKey(formData.password, user.salt);
    if (derivedKey === user.passwordHash) {
      attempt.success = true;
      setAuthState(prev => ({
        ...prev,
        currentUser: user,
        attempts: [...prev.attempts, attempt]
      }));
      setStep('totp');
    } else {
      setAuthState(prev => ({
        ...prev,
        attempts: [...prev.attempts, attempt]
      }));
      alert('Invalid password');
    }

    return attempt.success;
  };

  const handleTOTPAuth = (token: string) => {
    if (!authState.currentUser?.totpSecret) return false;

    const attempt: AuthenticationAttempt = {
      timestamp: Date.now(),
      success: false,
      method: 'totp',
      userId: authState.currentUser.id
    };

    if (verifyTOTP(token, authState.currentUser.totpSecret)) {
      attempt.success = true;
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        attempts: [...prev.attempts, attempt]
      }));
      setStep('complete');
    } else {
      setAuthState(prev => ({
        ...prev,
        attempts: [...prev.attempts, attempt]
      }));
      alert('Invalid TOTP code');
    }

    return attempt.success;
  };

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      currentUser: null,
      attempts: []
    });
    setStep('initial');
    setFormData({ username: '', password: '' });
  };

  const renderAdminDashboard = () => {
    if (!authState.currentUser?.isAdmin) return null;

    return (
      <div className="mt-8 border-t pt-4">
        <div className="flex items-center mb-4">
          <Users className="h-6 w-6 text-indigo-600 mr-2" />
          <h3 className="text-xl font-medium">Admin Dashboard</h3>
        </div>
        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="p-4 bg-gray-50 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-semibold text-indigo-600">{user.username}</h4>
                  <p className="text-sm text-gray-600">ID: {user.id}</p>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.isAdmin ? 'Admin' : 'User'}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">Registered:</p>
                  <p className="font-medium">{new Date(user.registeredAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">2FA Status:</p>
                  <p className="font-medium">{user.totpSecret ? 'Enabled' : 'Not Set'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600">Password Hash:</p>
                  <p className="font-mono text-xs break-all bg-gray-100 p-1 rounded">
                    {user.passwordHash}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-center mb-8">
              <Shield className="h-12 w-12 text-indigo-600" />
            </div>
            
            <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
              Two-Factor Authentication Demo
            </h2>

            {step === 'initial' && (
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex justify-center space-x-4 mb-6">
                  <button
                    className={`px-4 py-2 rounded-md ${mode === 'login' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => setMode('login')}
                  >
                    Login
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md ${mode === 'register' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => setMode('register')}
                  >
                    Register
                  </button>
                </div>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
                <button
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                  onClick={() => mode === 'register' ? handleRegister() : handlePasswordAuth()}
                >
                  {mode === 'register' ? 'Register' : 'Login'}
                </button>
              </div>
            )}

            {step === 'totp' && authState.currentUser?.totpSecret && (
              <div className="max-w-md mx-auto space-y-4">
                <div className="flex items-center justify-center mb-4">
                  <QRCodeSVG
                    value={`otpauth://totp/Demo:${authState.currentUser.username}?secret=${authState.currentUser.totpSecret}&issuer=Demo`}
                    size={200}
                    className="mx-auto"
                  />
                </div>
                <p className="text-center text-sm text-gray-600 mb-4">
                  {mode === 'register' 
                    ? 'Scan this QR code with your authenticator app to complete registration'
                    : 'Enter the code from your authenticator app'}
                </p>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter TOTP code"
                  onChange={(e) => handleTOTPAuth(e.target.value)}
                />
              </div>
            )}

            {step === 'complete' && authState.isAuthenticated && (
              <div className="space-y-4">
                <div className="text-center text-green-600 mb-4">
                  <p className="text-xl font-semibold">Authentication Complete!</p>
                  <p className="mt-2">Welcome, {authState.currentUser?.username}!</p>
                </div>

                {renderAdminDashboard()}

                <div className="max-w-md mx-auto">
                  <button
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}

            {authState.attempts.length > 0 && (
              <div className="mt-8 max-w-md mx-auto">
                <h3 className="text-lg font-medium mb-4">Authentication Attempts:</h3>
                <div className="space-y-2">
                  {authState.attempts.map((attempt, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-md ${
                        attempt.success ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      <p>
                        Method: {attempt.method} - {attempt.success ? 'Success' : 'Failed'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(attempt.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationDemo;