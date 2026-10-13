import React from 'react';
import {createRoot} from 'react-dom/client';
import {AuthProvider,useAuth} from './AuthProvider';
import ProfileMenu from './ProfileMenu';
function LandingAccount(){const auth=useAuth();return <ProfileMenu user={auth.user} onLogout={auth.logout} providers={auth.capabilities.providers} onConnect={async provider=>window.location.assign(await auth.oauth(provider,'/landing.html','link'))}/>;}
const host=document.getElementById('landing-account');if(host)createRoot(host).render(<AuthProvider><LandingAccount/></AuthProvider>);
