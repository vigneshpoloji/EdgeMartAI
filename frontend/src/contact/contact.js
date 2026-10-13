import {backend} from '../integrations/api.client.js';

const form = document.getElementById('contact-form');
if (form) {
  const status = document.getElementById('contact-status');
  const button = form.querySelector('button[type="submit"]');
  let pending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    pending = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    status.textContent = '';
    status.dataset.state = 'pending';
    try {
      const values = Object.fromEntries(new FormData(form));
      const result = await backend.api('/api/contact', {method: 'POST', body: values, timeoutMs: 12000});
      status.textContent = result.message;
      status.dataset.state = 'success';
      form.reset();
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error.code === 'RATE_LIMITED'
        ? 'Too many submissions. Wait before trying again, or use the Gmail link below.'
        : error.code === 'CONTACT_NOT_CONFIGURED'
          ? 'Email is being set up. Please use the Gmail link below to get in touch.'
        : error.code === 'INVALID_REQUEST'
          ? 'Check your details and enter a message of at least 5 characters.'
          : 'Your message could not be confirmed. Your text is still here; try later or use the Gmail link below.';
    } finally {
      pending = false;
      button.disabled = false;
      button.textContent = 'Get in touch!';
    }
  });
}
