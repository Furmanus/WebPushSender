export function parseFormToJson(htmlFormElement) {
  if (!htmlFormElement instanceof HTMLFormElement) {
    throw new Error('Attempting to parse form data from invalid HTML element');
  }

  const formData = new FormData(htmlFormElement);
  const result = {};

  for (const [key, value] of formData) {
    result[key] = value;
  }

  return result;
}

export class FormDataBuilder {
  #formData;
  #parsedData = {
    notificationData: {},
    sub: null,
  };

  constructor(form) {
    this.#formData = new FormData(form);
  }

  static getInstance(form) {
    if (!form instanceof HTMLFormElement) {
      throw new Error('Attempting to parse form data from invalid HTML element');
    }

    return new FormDataBuilder(form);
  }

  withBasicData() {
    this.#parsedData.notificationData.title = this.#formData.get('title') || 'Title';
    this.#parsedData.notificationData.payload = this.#formData.get('payload') || 'Content';
    this.#parsedData.notificationData.image = this.#formData.get('bigImage') || 'https://www.wykop.pl/cdn/c3397993/link_APS46Yd2B4MO6ioguXsfkoSHNJoAOjkJ,w1200h627f.jpg';

    return this;
  }

  withActionButtons() {
    const actions = [];
    const action1Title = this.#formData.get('action1Title');
    const action1Icon = this.#formData.get('action1Icon');
    const action2Title = this.#formData.get('action2Title');
    const action2Icon = this.#formData.get('action2Icon');

    if (action1Title) {
      actions.push({
        action: 'action1',
        title: action1Title,
        icon: action1Icon ?? 'https://i.ibb.co/3fH6vD5/pobrane.jpg',
      });
    }

    if (action2Title) {
      actions.push({
        action: 'action2',
        title: action2Title,
        icon: action2Icon ?? 'https://i.ibb.co/MMQhrw9/image-jpg.jpg',
      })
    }

    this.#parsedData.notificationData.actions = actions;

    return this;
  }

  withIcon() {
    this.#parsedData.notificationData.icon = this.#formData.get('icon') || 'https://uxwing.com/wp-content/themes/uxwing/download/hand-gestures/good-icon.png';

    return this;
  }

  withCustomSubscriptionData() {
    const useCurrentData = this.#formData.get('useCurrentData') === 'on';
    const endpoint = this.#formData.get('endpoint');
    const auth = this.#formData.get('auth');
    const p256dh = this.#formData.get('p256dh');

    if (!useCurrentData) {
      this.#parsedData.sub = {
        endpoint,
        expirationTime: null,
        keys: {
          auth,
          p256dh,
        }
      }
    }

    return this;
  }

  build() {
    return this
      .withActionButtons()
      .withBasicData()
      .withCustomSubscriptionData()
      .withIcon()
      .getParsedData();
  }

  getParsedData () {
    return this.#parsedData;
  }
}
