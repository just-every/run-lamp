import assert from 'node:assert/strict';
import { operatorHydrated } from './operator-hydrated.mjs';

export async function localPasskeyFlow({ browser, ownerPage, origin, terminalLink }) {
  const create = async (path, data) => {
    const response = await ownerPage.request.post(origin+path,{data,headers:{Origin:origin}});
    assert.equal(response.status(),201,path);
    return response.json();
  };
  const { component } = await create('/api/app/components',{
    name:'Partner dispatch',description:'Order dispatch updates',internal:false,groupId:null,displayOrder:0,note:'',
  });
  await create('/api/app/status-pages',{
    path:'partner-network',kind:'audience',pageName:'Partner network',tagline:'Dispatch updates for partners',
    accentColor:'#3057A6',timezone:'UTC',componentIds:[component.id],footerCreditEnabled:true,
  });
  const destination = '/status-pages/partner-network/?from=dispatch';
  const goToSignIn = async page => {
    await page.goto(origin+destination);
    const signIn = page.getByRole('link',{name:/sign in/i}).first();
    const url = new URL(await signIn.getAttribute('href'),origin);
    assert.equal(url.searchParams.get('returnTo'),destination);
    await signIn.click();
    const handoff = new URL(page.url());
    assert.equal(handoff.pathname,'/__dev/key');
    assert.equal(handoff.searchParams.get('returnTo'),destination);
  };
  const reachedPartners = page => page.waitForURL(url => url.pathname+url.search===destination);
  const visitor = await browser.newContext();
  try {
    const page = await visitor.newPage();
    await goToSignIn(page);
    // Keep the terminal credential out of the test reporter, even on a navigation failure.
    await page.goto(terminalLink).catch(() => assert.fail('The terminal link could not be opened.'));
    await reachedPartners(page);
    const external = await fetch(origin+'/signin?returnTo=%2F%252fexample.test', {redirect:'manual'});
    assert.equal(external.headers.get('location'),'/__dev/key');
  } finally { await visitor.close(); }

  await ownerPage.goto(origin+'/app/settings#sign-in');
  await operatorHydrated(ownerPage);
  const cdp = await ownerPage.context().newCDPSession(ownerPage);
  await cdp.send('WebAuthn.enable');
  const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{
    protocol:'ctap2',transport:'internal',hasResidentKey:true,hasUserVerification:true,
    isUserVerified:true,automaticPresenceSimulation:true,
  }});
  try {
    await ownerPage.getByRole('link',{name:/local passkey/i}).click();
    await ownerPage.getByRole('button',{name:/enroll passkey/i}).click();
    await ownerPage.waitForFunction(() => !document.querySelector('[data-passkey]'));
    assert.equal((await cdp.send('WebAuthn.getCredentials',{authenticatorId})).credentials.length,1);
    const session = async () => (await (await ownerPage.request.get(origin+'/api/app/session')).json()).operator;
    const original = await session(), changedEmail = 'local-passkey-owner@example.test';
    const changeEmail = email => ownerPage.request.post(origin+'/auth/owner-profile',{data:{email},headers:{Origin:origin}});
    assert.equal((await changeEmail(changedEmail)).status(),200,'the local owner can change their email without mail');
    const signOut = await ownerPage.request.post(origin+'/api/app/session/signout',{data:{},headers:{Origin:origin}});
    assert.equal(signOut.status(),204);
    await ownerPage.context().clearCookies();
    await goToSignIn(ownerPage);
    await ownerPage.getByRole('button',{name:/sign in with a passkey/i}).click();
    await reachedPartners(ownerPage);
    const after = await session();
    assert.deepEqual([after.id,after.email],[original.id,changedEmail],'the existing passkey still admits the same account');
  } finally { await cdp.detach(); }
}
