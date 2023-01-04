import { Modal } from 'bootstrap';

export function showContentInModal(content, tagToWrap) {
    const modalElement = document.getElementById('modal');

    if (tagToWrap) {
        const tag = document.createElement(tagToWrap);

        tag.innerHTML = content;

        document.getElementById('modal-body').append(tag);
    } else {
        document.getElementById('modal-body').append(content);
    }

    new Modal('#modal').show();

    modalElement.addEventListener('hidden.bs.modal', () => {
        document.getElementById('modal-body').innerHTML = '';
    }, { once: true })
}