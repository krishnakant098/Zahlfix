import { sessionCookie, redirect } from './_auth.mjs';

export default async (req) => {
  const incomingUrl = new URL(req.url);
  if (incomingUrl.hostname === 'www.zahlfix.com') { incomingUrl.hostname = 'zahlfix.com'; incomingUrl.protocol = 'https:'; return redirect(incomingUrl.toString(), 301); }
  return redirect('/login', 303, { 'Set-Cookie': sessionCookie('', 0) });
};

export const config = { path: '/logout' };
