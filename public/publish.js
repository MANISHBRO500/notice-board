const noticeForm = document.querySelector('#noticeForm');
const adminStatus = document.querySelector('#adminStatus');
const submitButton = document.querySelector('#submitButton');
const toast = document.querySelector('#toast');
const titleInput = document.querySelector('#title');

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

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
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
    await fetchJson('/api/notices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password
      },
      body: JSON.stringify(payload)
    });

    noticeForm.reset();
    titleInput.focus();
    showToast('Notice published. Open View Notices to see it.');
    setAdminStatus('Ready');
  } catch (error) {
    showToast(error.message);
    setAdminStatus('Check');
  } finally {
    submitButton.disabled = false;
  }
});
