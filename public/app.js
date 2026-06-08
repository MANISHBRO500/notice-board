const noticeForm = document.querySelector('#noticeForm');
const refreshButton = document.querySelector('#refreshButton');
const noticeList = document.querySelector('#noticeList');
const noticeTemplate = document.querySelector('#noticeTemplate');
const noticeCount = document.querySelector('#noticeCount');
const adminStatus = document.querySelector('#adminStatus');
const submitButton = document.querySelector('#submitButton');
const toast = document.querySelector('#toast');

let toastTimeout;

function showToast(message) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimeout = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 3200);
}

function setAdminStatus(message) {
  adminStatus.textContent = message;
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function renderEmptyState(message, isError = false) {
  noticeList.replaceChildren();

  const state = document.createElement('div');
  state.className = isError ? 'error-state' : 'empty-state';
  state.textContent = message;
  noticeList.append(state);
}

function renderNotices(notices) {
  noticeList.replaceChildren();
  noticeCount.textContent = `${notices.length} ${notices.length === 1 ? 'notice' : 'notices'}`;

  if (!notices.length) {
    renderEmptyState('No notices yet.');
    return;
  }

  const fragment = document.createDocumentFragment();

  notices.forEach((notice) => {
    const card = noticeTemplate.content.firstElementChild.cloneNode(true);
    const image = card.querySelector('.notice-image');
    const date = card.querySelector('.notice-date');
    const title = card.querySelector('h3');
    const message = card.querySelector('p');

    if (notice.imageUrl) {
      image.src = notice.imageUrl;
      image.alt = notice.title;
      image.addEventListener('error', () => {
        card.classList.add('no-image');
        image.removeAttribute('src');
      });
    } else {
      card.classList.add('no-image');
    }

    date.textContent = formatDate(notice.createdAt);
    title.textContent = notice.title;
    message.textContent = notice.message;

    fragment.append(card);
  });

  noticeList.append(fragment);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

async function loadNotices() {
  try {
    const data = await fetchJson('https://notice-board-3pyh.onrender.com/api/notices');
    renderNotices(data.notices || []);
  } catch (error) {
    noticeCount.textContent = 'Offline';
    renderEmptyState(error.message, true);
  }
}

noticeForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(noticeForm);
  const payload = {
    title: String(formData.get('title') || '').trim(),
    message: String(formData.get('message') || '').trim(),
    imageUrl: String(formData.get('imageUrl') || '').trim()
  };
  const password = String(formData.get('adminPassword') || '');

  submitButton.disabled = true;
  setAdminStatus('Saving');

  try {
    await fetchJson('https://notice-board-3pyh.onrender.com/api/notices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password
      },
      body: JSON.stringify(payload)
    });

    noticeForm.reset();
    showToast('Notice published.');
    setAdminStatus('Ready');
    await loadNotices();
  } catch (error) {
    showToast(error.message);
    setAdminStatus('Check');
  } finally {
    submitButton.disabled = false;
  }
});

refreshButton.addEventListener('click', () => {
  loadNotices();
});

loadNotices();
