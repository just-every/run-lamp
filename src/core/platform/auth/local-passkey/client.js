const button = document.querySelector('[data-passkey]');
const message = document.querySelector('#passkey-status');
const operation = button.dataset.passkey;

async function exchange(credential) {
  const response = await fetch('/auth/local/passkey', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({operation, credential}),
  });
  if (!response.ok) throw new Error('Passkey request failed');
  return response.json();
}

if (!globalThis.PublicKeyCredential?.parseCreationOptionsFromJSON || !PublicKeyCredential.parseRequestOptionsFromJSON) {
  message.textContent = 'Use a browser that supports passkeys, or open the private link from rer dev.';
} else {
  button.disabled = false;
  button.addEventListener('click', async () => {
    button.disabled = true;
    message.textContent = 'Follow the prompt on your device.';
    try {
      const options = await exchange();
      const credential = operation === 'enroll'
        ? await navigator.credentials.create({publicKey: PublicKeyCredential.parseCreationOptionsFromJSON(options)})
        : await navigator.credentials.get({publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(options)});
      await exchange(credential.toJSON());
      if (operation === 'signin') location.assign(button.dataset.returnTo);
      else location.reload();
    } catch {
      message.textContent = 'The passkey could not be used. Try again, or open the private link from rer dev.';
      button.disabled = false;
    }
  });
}
