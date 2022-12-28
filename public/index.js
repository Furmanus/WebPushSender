import './currentSubscriptionData.js';
import { FormDataBuilder } from './formDataBuilder.js';

const form = document.querySelector('#send_from_consent');
const resCurrentContainer = document.querySelector('#res');
const clearWorkersButton = document.querySelector('#clearWorkers');
const changeVapidButton = document.querySelector('#regenerateVapid');
const changeVapidForm = document.querySelector('#setVapid');
const regenerateSubscriptionButton = document.querySelector('#regenerateSubscription');
const bigImageLinkElement = document.getElementById('bigImageLink');
const bigImageLinkCopyButton = document.getElementById('bigImageLinkCopy');

const socket = io();

form.addEventListener('submit', async e => {
  e.preventDefault();

  const formDataJson = FormDataBuilder.getInstance(e.target).build();
  const vapidPublicKey = await fetch('/vapidKey').then(res => res.text());

  if (Notification.permission !== 'denied') {
    const swRegistration = await navigator.serviceWorker.register('/sw.js');
    let pushSubscription = await swRegistration.pushManager.getSubscription();
    const isSubscribed = pushSubscription !== null;

    if (!isSubscribed) {
      pushSubscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });
    }

    if (pushSubscription) {
      formDataJson.sub = formDataJson.sub || pushSubscription;

      const res = await fetch('/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataJson),
      }).then(res => res.json());

      resCurrentContainer.innerHTML = prettyPrintJson.toHtml({
        responseData: res.response,
        error: res.error,
        requestData: res.request,
      }, {
        indent: 2,
      });
    }
  }
});

changeVapidForm.addEventListener('submit', e => {
  changeVapidErrorContainer.textContent = '';

  e.preventDefault();

  const formData = new FormData(e.target);
  const privateVapid = formData.get('privateVapid');
  const publicVapid = formData.get('publicVapid');

  fetch('/regenerateVapid', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      privateKey: privateVapid,
      publicKey: publicVapid,
    })
  }).then(async res => {
    if (res.ok) {
      changeVapidErrorContainer.textContent = '';
    } else {
      const err = await res.text();

      changeVapidErrorContainer.textContent = err;
    }
  });
});

privateVapid.addEventListener('focus', () => {
  changeVapidErrorContainer.textContent = '';
});
publicVapid.addEventListener('focus', () => {
  changeVapidErrorContainer.textContent = '';
});

clearWorkersButton.addEventListener('click', async () => {
  const registrations = await navigator.serviceWorker.getRegistrations();
  const unregisterOperations = [];

  for (const registration of registrations) {
    registration.unregister();
  }
});



changeVapidButton.addEventListener('click', () => {
  navigator.serviceWorker.ready.then(function(reg) {
    reg.pushManager.getSubscription().then(function(subscription) {
      subscription.unsubscribe().then(function(successful) {
        console.log('unsubscribed!', subscription);
      }).catch(function(e) {
        console.error('unsubscribe failed', e);
      })
    })
  });

  fetch('/regenerateVapid', {
    method: 'PUT',
  });
});

regenerateSubscriptionButton.addEventListener('click', () => {

});

bigImageLinkCopyButton.addEventListener('click', () => {
  const content = bigImageLinkElement.textContent;

  form.querySelector('#bigImage').value = content;
});

async function regenerateSubscription() {
  try {
    const swRegistration = await navigator.serviceWorker.ready;
    const subscription = await swRegistration.pushManager.getSubscription();

    await subscription.unsubscribe();
    const vapidPublicKey = await fetch('/vapidKey').then(res => res.text());
    await swRegistration.pushManager.subscribe({
      userVisibleOnly: true, applicationServerKey: vapidPublicKey,
    });
  } catch (e) {
    console.error('Error during subscription regeneration', e);
  }
}

socket.on('vapidChange', ({privateKey, publicKey}) => {
  document.getElementById('prvVapidText').textContent = privateKey;
  document.getElementById('pubVapidText').textContent = publicKey;
});
