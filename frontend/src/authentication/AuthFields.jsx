import React, { useId, useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
export function PasswordField({
  label = 'Password',
  value,
  onChange,
  autoComplete = 'current-password',
  disabled = false
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return <label className="em-auth-field" htmlFor={id}><span>{label}</span><div className="em-auth-input"><LockKeyhole size={16} /><input id={id} aria-label={label} type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} required maxLength={128} disabled={disabled} /><button type="button" aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={visible} disabled={disabled} onClick={() => setVisible(old => !old)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>;
}
export function GoogleMark() {
  return <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11c-.5 2.5-1.9 4.6-4.1 6v5h6.6c3.8-3.5 6.1-8.7 6.1-14.7Z" /><path fill="#34A853" d="M24 44c5.4 0 10-1.8 13.4-4.9l-6.6-5c-1.8 1.2-4.1 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H6v5.2C9.4 39.5 16.2 44 24 44Z" /><path fill="#FBBC05" d="M12.8 27.8c-.4-1.2-.6-2.5-.6-3.8s.2-2.6.6-3.8V15H6a20 20 0 0 0 0 18l6.8-5.2Z" /><path fill="#EA4335" d="M24 12c2.9 0 5.5 1 7.5 2.9l5.6-5.6C33.8 6 29.4 4 24 4 16.2 4 9.4 8.5 6 15l6.8 5.2C14.4 15.5 18.8 12 24 12Z" /></svg>;
}
