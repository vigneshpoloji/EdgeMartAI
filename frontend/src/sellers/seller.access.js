export async function registerSeller(auth, createProfile, values) {
  if (auth.user) return createProfile({...values, email: auth.user.email});
  return auth.signup({...values, sellerProfile: values});
}

export async function signInSeller(auth, refresh, credentials) {
  const user = await auth.login(credentials);
  await refresh(user);
  return user;
}
