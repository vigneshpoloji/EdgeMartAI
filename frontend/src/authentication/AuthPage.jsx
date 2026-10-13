import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Github, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { GoogleMark } from './AuthFields';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import { authMessage, passwordChecks, oauthFailureMessage } from './auth.utils';
import ProfileMenu from './ProfileMenu';
import './authentication.css';
import './profile-menu.css';
const TITLES = {
  login: ['WELCOME BACK', 'Your world.', 'One sign-in away.'],
  signup: ['A LITTLE HELLO. A WORLD OF POSSIBILITIES.', 'Make it', 'your EdgeMart.']
};
const DESCRIPTIONS = {
  login: 'Your favourite worlds are right where you left them.',
  signup: 'One account. Ten shopping worlds. A little more you.'
};
export default function AuthPage({ mode = 'login', onModeChange, returnTo = '/landing.html', departmentName }) {
  const auth = useAuth();
  const oauthError = new URLSearchParams(window.location.search).get('oauthError');
  const [values, setValues] = useState({name: '', email: '', password: '', confirm: '', remember: false});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice,setNotice]=useState(()=>new URLSearchParams(window.location.search).has('registered')?'Account created. Please sign in to continue.':'');
  const heading = useRef(null), live = useRef(true), running = useRef(false);
  const view = mode === 'signup' ? 'signup' : 'login';
  const orange = view === 'signup', socialVisible = true;
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  useEffect(() => {
    setError(oauthFailureMessage(oauthError));
    setValues(old => ({...old, password: '', confirm: ''}));
    heading.current?.focus();
  }, [view,oauthError]);
  async function perform(action) {
    if (running.current) return;
    running.current = true;
    setPending(true);
    setError('');
    try { await action(); }
    catch (err) { if (live.current) setError(authMessage(err)); }
    finally { running.current = false; if (live.current) setPending(false); }
  }
  const changeMode = next => { if (!pending) onModeChange?.(next); };
  async function submit(event) {
    event.preventDefault();
    if (view === 'signup' && values.name.trim().length < 2) { setError('Enter a name with at least two characters.'); return; }
    if (!auth.previewMode && view === 'signup') {
      if (passwordChecks(values.password).some(rule => !rule.passed)) { setError('Choose a password that meets all four requirements.'); return; }
      if (values.password !== values.confirm) { setError('Your passwords don’t match. Please check them.'); return; }
    }
    await perform(async () => {
      const credentials = {email: values.email.trim(), password: values.password, remember: values.remember};
      if (view === 'signup') {await auth.signup({...credentials, name: values.name.trim()});setNotice('Account created. Please sign in to continue.');onModeChange?.('login');}
      else await auth.login(credentials);
      setValues(old => ({...old, password: '', confirm: ''}));
    });
  }
  async function social(provider) {
    await perform(async () => { window.location.assign(await auth.oauth(provider, returnTo, view)); });
  }
  if(auth.user&&oauthError)return <main className="em-oauth-recovery"><a href="/landing.html" className="em-auth-brand"><img src="/logo.svg" alt=""/><span>EdgeMart</span></a><h1>Connect your sign-in account</h1><p role="alert">{oauthError==='account_link_required'?'You are signed in. Open your profile below, choose Connect Google or GitHub, and select the provider account with the same email.':oauthFailureMessage(oauthError)}</p><ProfileMenu user={auth.user} onLogout={auth.logout} providers={auth.capabilities.providers} onConnect={async provider=>window.location.assign(await auth.oauth(provider,returnTo,'link'))}/><a className="em-oauth-continue" href={returnTo}>Continue to EdgeMart</a></main>;
  return <div className={`em-auth-page${orange ? ' is-signup' : ''}`}><header className="em-auth-top"><a href="/landing.html" className="em-auth-brand"><img src="/logo.svg" alt="" /><span>EdgeMart<small>YOUR WORLD, WITH AN EDGE.</small></span></a><a href="/landing.html" className="em-auth-back"><ArrowLeft size={14} />Back to your world</a></header>
    <main className="em-auth-card"><div className="em-auth-form-side"><div className="em-auth-tabs" role="group" aria-label="Choose authentication page"><button aria-pressed={!orange} disabled={pending || Boolean(auth.user)} onClick={() => changeMode('login')}>Sign in</button><button aria-pressed={orange} disabled={pending || Boolean(auth.user)} onClick={() => changeMode('signup')}>Create account</button><span className="em-auth-tab-track" /></div><div className="em-auth-form-content"><span className="em-auth-eyebrow">{TITLES[view][0]}</span><h1 ref={heading} tabIndex={-1}>{TITLES[view][1]}<br /><em>{TITLES[view][2]}</em></h1><p className="em-auth-intro">{DESCRIPTIONS[view]}</p>{departmentName && <span className="em-auth-destination"><ShoppingBag size={12} />Continue to {departmentName.charAt(0).toUpperCase() + departmentName.slice(1)}</span>}
    
    {socialVisible && <><button className="em-auth-google"  disabled={pending||!auth.capabilities.providers.includes('google')} onClick={() => social('google')}><GoogleMark />{view === 'signup' ? 'Sign up with Google' : 'Continue with Google'}<ArrowRight size={15} /></button><div className="em-auth-other-social"><button  disabled={pending||!auth.capabilities.providers.includes('github')} onClick={() => social('github')}><Github size={15} />{view==='signup'?'Sign up with GitHub':'Continue with GitHub'}</button></div><div className="em-auth-divider"><span>{<>or {view === 'signup' ? 'create an account' : 'sign in'} with email</>}</span></div></>}
    {notice && <p className="em-auth-success" role="status">{notice}</p>}{error && <p className="em-auth-error" role="alert">{error}</p>}
    {view === 'login' && <LoginPage previewMode={auth.previewMode} values={values} setValues={setValues} pending={pending} onSubmit={submit} onModeChange={changeMode} />}{view === 'signup' && <SignupPage previewMode={auth.previewMode} values={values} setValues={setValues} pending={pending} onSubmit={submit} />}
    <p className="em-auth-switch">{socialVisible ? view === 'login' ? <>New around here? <button disabled={pending} onClick={() => changeMode('signup')}>Create an account <ArrowRight size={12} /></button></> : <>Already part of EdgeMart? <button disabled={pending} onClick={() => changeMode('login')}>Sign in <ArrowRight size={12} /></button></> : !auth.user && <button disabled={pending} onClick={() => changeMode('login')}><ArrowLeft size={12} />Back to sign in</button>}</p><p className="em-auth-footnote"><ShieldCheck size={13} />{auth.previewMode ? 'Your everyday, in one place.' : 'Your password stays out of browser storage.'}</p></div></div>
    <aside className="em-auth-story"><div className="em-auth-story-grid" /><div className="em-auth-story-top"><span>EDGEMART / YOUR EVERYDAY, REIMAGINED.</span><span className="em-auth-story-number">{orange ? '02' : '01'}</span></div><div className="em-auth-story-copy"><span className="em-auth-story-label">{orange ? 'A NEW BEGINNING' : 'GOOD TO SEE YOU AGAIN'}</span><h2>{orange ? <>A little hello.<br />A world of <i>possibilities.</i></> : <>All your worlds.<br />One familiar <i>place.</i></>}</h2><p>{orange ? 'Fresh finds, favourite things and everyday essentials. Make room for a world that feels like you.' : 'From greener corners to your next good read. Come back to the little things that make life yours.'}</p></div><img className="em-auth-story-photo" src="/images/hero-fruits.jpg" alt="Fresh market collection"/><div className="em-auth-story-bottom"><span>10 WORLDS. ONE YOU.</span><button disabled={pending || Boolean(auth.user)} onClick={() => changeMode(orange ? 'login' : 'signup')}>{orange ? 'Already have an account?' : 'New to this little world?'}<ArrowRight size={17} /></button></div></aside></main><footer className="em-auth-footer"><span>YOUR EVERYDAY. A LITTLE EXTRAORDINARY.</span><span>EdgeMart AI · Made for your world.</span></footer></div>;
}