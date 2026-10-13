import React, { useState } from 'react';
import { ArrowRight, Check, Mail, UserRound } from 'lucide-react';
import { PasswordField } from './AuthFields';
import { passwordChecks } from './auth.utils';
import { useAuth } from './AuthProvider';

export default function SignupPage({
  values: externalValues,
  setValues: externalSetValues,
  pending: externalPending,
  previewMode = false,
  onSubmit: externalOnSubmit,
  onSuccess
}) {
  const { signup } = useAuth();
  const [internalValues, setInternalValues] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
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

    if (!previewMode && values.password !== values.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setInternalPending(true);
    try {
      await signup({
        name: values.name,
        email: values.email,
        password: values.password
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setInternalPending(false);
    }
  };

  return (
    <form className="em-auth-form" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <label className="em-auth-field">
        <span>Your name</span>
        <div className="em-auth-input">
          <UserRound size={16} />
          <input
            name="name"
            autoComplete="name"
            placeholder="What should we call you?"
            value={values.name}
            onChange={event => setValues(old => ({
              ...old,
              name: event.target.value
            }))}
            minLength={2}
            maxLength={100}
            required
            disabled={pending}
          />
        </div>
      </label>

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
            maxLength={254}
            required
            disabled={pending}
          />
        </div>
      </label>

      {!previewMode && (
        <>
          <PasswordField
            value={values.password}
            autoComplete="new-password"
            onChange={event => setValues(old => ({
              ...old,
              password: event.target.value
            }))}
            disabled={pending}
          />

          <div className="em-auth-password-rules" aria-label="Password requirements">
            {passwordChecks(values.password).map(rule => (
              <span key={rule.label} className={rule.passed ? 'passed' : ''}>
                <Check size={11} />
                {rule.label}
              </span>
            ))}
          </div>

          <PasswordField
            label="Confirm password"
            value={values.confirm}
            autoComplete="new-password"
            onChange={event => setValues(old => ({
              ...old,
              confirm: event.target.value
            }))}
            disabled={pending}
          />

          <label className="em-auth-remember">
            <input
              type="checkbox"
              checked={values.remember}
              onChange={event => setValues(old => ({
                ...old,
                remember: event.target.checked
              }))}
              disabled={pending}
            />
            Keep me signed in on this device
          </label>
        </>
      )}

      <button type="submit" className="em-auth-submit" disabled={pending}>
        {pending ? 'Just a moment…' : 'Create account'}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}