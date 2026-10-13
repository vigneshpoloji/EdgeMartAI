import React, { useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { PasswordField } from './AuthFields';
import { useAuth } from './AuthProvider';
import { authMessage } from './auth.utils.js';

export default function LoginPage({
  values: externalValues,
  setValues: externalSetValues,
  pending: externalPending,
  previewMode = false,
  onSubmit: externalOnSubmit,
  onSuccess
}) {
  const { login } = useAuth();
  const [internalValues, setInternalValues] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [internalPending, setInternalPending] = useState(false);
  const [error, setError] = useState('');

  const values = externalValues ?? internalValues;
  const setValues = externalSetValues ?? setInternalValues;
  const pending = externalPending ?? internalPending;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (externalOnSubmit) {
      return externalOnSubmit(event);
    }

    setInternalPending(true);
    try {
      await login(values);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setInternalPending(false);
    }
  };

  return (
    <form className="em-auth-form" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <label className="em-auth-field">
        <span>Email address</span>
        <div className="em-auth-input">
          <Mail size={16} />
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={event => setValues(old => ({
              ...old,
              email: event.target.value
            }))}
            required
            maxLength={254}
            disabled={pending}
          />
        </div>
      </label>

      {!previewMode && (
        <>
          <PasswordField
            value={values.password}
            onChange={event => setValues(old => ({
              ...old,
              password: event.target.value
            }))}
            disabled={pending}
          />

          <div className="em-auth-form-options">
            <label>
              <input
                type="checkbox"
                checked={values.remember}
                onChange={event => setValues(old => ({
                  ...old,
                  remember: event.target.checked
                }))}
                disabled={pending}
              />
              Keep me signed in
            </label>
          </div>
        </>
      )}

      <button type="submit" className="em-auth-submit" disabled={pending}>
        {pending ? 'Just a moment…' : 'Sign in'}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
