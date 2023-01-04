import './currentSubscriptionData.js';
import { FormDataBuilder } from './formDataBuilder.js';

const form = document.querySelector('#send_from_consent');
const clearWorkersButton = document.querySelector('#clearWorkers');
const changeVapidButton = document.querySelector('#regenerateVapid');
const changeVapidForm = document.querySelector('#setVapid');
const fetchVapidsButton = document.querySelector('#fetchVapids');
const regenerateSubscriptionButton = document.querySelector('#regenerateSubscription');

form.addEventListener('submit', async e => {
  e.preventDefault();
  const formDataJson = FormDataBuilder.getInstance(e.target).build();
  const { publicKey: vapidPublicKey } = await fetch('/vapidKey').then(res => res.json());

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
      })
        .then(res => res.json())
        .then(parsedRes => {
          return new Promise((resolve, reject) => {
            const blob = new Blob([parsedRes.request.body.data], { type: 'text/plain' });
            const reader = new FileReader();

            reader.readAsText(blob, 'utf-8');

            reader.addEventListener('load', () => {
              parsedRes.request.body.data = reader.result;
              resolve(parsedRes);
            }, { once: true });

            reader.addEventListener('error', (e) => {
              reject(e);
            }, { once: true });
          });
        });

      import('./modal.js').then(module => {
        module.showContentInModal(prettyPrintJson.toHtml({
          responseData: res.response,
          error: res.error,
          requestData: res.request,
        }, {
          indent: 2,
        }), 'pre');
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

      return res.json();
    } else {
      const err = await res.text();

      changeVapidErrorContainer.textContent = err;
    }
  }).then((body) => {
    const { publicKey, privateKey } = body;

    document.getElementById('pubVapidText').innerText = publicKey;
    document.getElementById('prvVapidText').innerText = privateKey;
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

  for (const registration of registrations) {
    registration.unregister();
  }
});

fetchVapidsButton.addEventListener('click', async () => {
  const { publicKey, privateKey } = await fetch('/vapidKey').then(res => res.json());

  document.getElementById('pubVapidText').innerText = publicKey;
  document.getElementById('prvVapidText').innerText = privateKey;
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

regenerateSubscriptionButton.addEventListener('click', regenerateSubscription);

async function regenerateSubscription() {
  try {
    const swRegistration = await navigator.serviceWorker.ready;
    const subscription = await swRegistration.pushManager.getSubscription();

    await subscription.unsubscribe();
    const { publicKey: vapidPublicKey, privateKey } = await fetch('/vapidKey').then(res => res.json());

    document.getElementById('pubVapidText').innerText = vapidPublicKey;
    document.getElementById('prvVapidText').innerText = privateKey;

    await swRegistration.pushManager.subscribe({
      userVisibleOnly: true, applicationServerKey: vapidPublicKey,
    });
  } catch (e) {
    console.error('Error during subscription regeneration', e);
  }
}
