export const DEPARTMENT_IDS = ['electronics', 'fruits', 'vegetables', 'jewellery', 'meat', 'pharmacy', 'groceries', 'books', 'food', 'plants'];
export const AUTH_MODES = ['login', 'signup'];
export function safeReturnTo(value, origin) {
  try {
    const url = new URL(value || '/landing.html', origin);
    if (url.origin !== origin || url.username || url.password || !['/', '/index.html'].includes(url.pathname)) return '/landing.html';
    const department = url.searchParams.get('department');
    if (DEPARTMENT_IDS.includes(department) && ['login','signup','dashboard'].includes(url.searchParams.get('seller'))) return `/?seller=${url.searchParams.get('seller')}&department=${department}`;
    return DEPARTMENT_IDS.includes(department) ? `/?department=${department}` : '/landing.html';
  } catch {
    return '/landing.html';
  }
}
export function passwordChecks(password) {
  return [{
    label: 'At least 8 characters',
    passed: password.length >= 8
  }, {
    label: 'Uppercase & lowercase letters',
    passed: /[A-Z]/.test(password) && /[a-z]/.test(password)
  }, {
    label: 'A number',
    passed: /[0-9]/.test(password)
  }, {
    label: 'A symbol',
    passed: /[^A-Za-z0-9\s]/.test(password)
  }];
}
export function oauthFailureMessage(code) {
  if(!code)return '';
  return {
    account_link_required: 'This email already has an EdgeMart account. Sign in using its original method (Google, GitHub or email/password), then open your profile and connect this sign-in provider.',
    account_link_mismatch: 'Choose the Google or GitHub account with the same email as your signed-in EdgeMart account. Open your profile to try connecting again.',
    identity_conflict: 'That sign-in provider is connected to another EdgeMart account. Use the provider for your current account, or sign out before switching accounts.',
    link_session_expired: 'Your linking session expired. Sign in using your original account method, then open your profile and try connecting again.'
  }[code] || 'Social sign-in could not finish. Try your existing account method, or check the provider configuration.';
}
export function authMessage(error) {
  return {
    NOT_CONFIGURED: 'Sign-in is not configured. Please contact the store administrator.',
    CSRF_EXPIRED: 'Your sign-in session changed. Refresh the page and try again.',
    ACCESS_DENIED: 'Your sign-in session changed. Refresh the page and try again.',
    INVALID_REQUEST: 'Check your account and store details, then try again.',
    SELLER_REQUIRED: 'Create a seller profile for this account to open Seller Studio.',
    DRIVER_REQUIRED: 'Use your delivery partner account to sign in here.',
    DATABASE_UNAVAILABLE: 'The database is unavailable. Please try again shortly.',
    FORBIDDEN: 'Refresh the page and retry your request.',
    OAUTH_NOT_CONFIGURED: 'Social sign-in needs OAuth configuration. Use email access for now.',
    INVALID_CREDENTIALS: 'The email or password is incorrect. Please try again.',
    ACCOUNT_EXISTS: 'An account already uses this email. Sign in with your existing password.',
    WEAK_PASSWORD: 'Use a stronger password that meets the requirements below.',
    RATE_LIMITED: 'Too many attempts. Please wait a little before trying again.',
    NETWORK_ERROR: 'We couldn’t reach sign-in. Check your connection and try again.',
    SESSION_EXPIRED: 'Your session has expired. Please sign in again.'
  }[error?.code] || 'Sign-in is temporarily unavailable. Please try again later.';
}
