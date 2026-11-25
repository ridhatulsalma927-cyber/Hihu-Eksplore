const LEGACY_DEMO_ACCOUNTS_KEY = 'halalexplore_aceh_v1_demo_accounts';
const LEGACY_DEMO_SESSION_KEY = 'halalexplore_aceh_v1_demo_session';

// Server-signed Bearer token kept strictly in JS memory (never in localStorage/sessionStorage)
let memoryAccessToken = null;

export function clearLegacyClientAuthStorage() {
  try {
    window.localStorage.removeItem(LEGACY_DEMO_ACCOUNTS_KEY);
    window.localStorage.removeItem(LEGACY_DEMO_SESSION_KEY);
  } catch {
    // Ignore storage access errors gracefully
  }
}

export function getDemoTravelerHint() {
  return {
    id: 'demo-traveler',
    name: 'Aisyah Rahma (Wisatawan Demo)',
    email: 'wisatawan@hihueksplor.demo',
    role: 'Wisatawan',
    passcode: 'hihu-wisatawan',
  };
}

export function hasAuthToken() {
  return Boolean(memoryAccessToken);
}

async function apiRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (memoryAccessToken) {
    headers.Authorization = `Bearer ${memoryAccessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    const payload = await response.json().catch(() => ({}));
    return { status: response.status, ...payload };
  } catch {
    return { status: 0, ok: false, errorCode: 'NETWORK_ERROR' };
  }
}

export async function fetchAuthStatus() {
  const res = await apiRequest('/api/auth/status', { method: 'GET' });
  if (res.ok) {
    return {
      adminEnvConfigured: Boolean(res.adminEnvConfigured),
      adminClaimed: Boolean(res.adminClaimed),
    };
  }
  return { adminEnvConfigured: false, adminClaimed: false };
}

export async function loginUser(email, password) {
  const res = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: String(email || '').trim(),
      password: String(password || ''),
    }),
  });
  if (res.ok && res.token && res.user) {
    memoryAccessToken = res.token;
    return { ok: true, user: res.user };
  }
  return { ok: false, errorCode: res.errorCode || 'INVALID_CREDENTIALS' };
}

export async function loginDemoTraveler() {
  const res = await apiRequest('/api/auth/demo-login', {
    method: 'POST',
    body: JSON.stringify({ accountId: 'demo-traveler' }),
  });
  if (res.ok && res.token && res.user) {
    memoryAccessToken = res.token;
    return { ok: true, user: res.user };
  }
  return { ok: false, errorCode: res.errorCode || 'NOT_FOUND' };
}

export async function registerUser({ name, email, password }) {
  const res = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: String(name || '').trim(),
      email: String(email || '').trim(),
      password: String(password || ''),
    }),
  });
  if (res.ok && res.token && res.user) {
    memoryAccessToken = res.token;
    return { ok: true, user: res.user };
  }
  return { ok: false, errorCode: res.errorCode || 'INVALID_INPUT' };
}

export async function claimCuratorAccount({ name, email, password }) {
  const res = await apiRequest('/api/auth/claim-admin', {
    method: 'POST',
    body: JSON.stringify({
      name: String(name || '').trim(),
      email: String(email || '').trim(),
      password: String(password || ''),
    }),
  });
  if (res.ok && res.token && res.user) {
    memoryAccessToken = res.token;
    return {
      ok: true,
      user: res.user,
      adminEnvConfigured: Boolean(res.adminEnvConfigured),
      adminClaimed: Boolean(res.adminClaimed),
    };
  }
  return { ok: false, errorCode: res.errorCode || 'INVALID_INPUT' };
}

export async function loginCuratorWithPasscode(passcode) {
  const res = await apiRequest('/api/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify({ passcode: String(passcode || '') }),
  });
  if (res.ok && res.token && res.user) {
    memoryAccessToken = res.token;
    return { ok: true, user: res.user };
  }
  return { ok: false, errorCode: res.errorCode || 'INVALID_CREDENTIALS' };
}

export async function updateUserProfile(name) {
  if (!memoryAccessToken) {
    return { ok: false, errorCode: 'UNAUTHORIZED' };
  }
  const res = await apiRequest('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify({ name: String(name || '').trim() }),
  });
  if (res.ok && res.token && res.user) {
    memoryAccessToken = res.token;
    return { ok: true, user: res.user };
  }
  return { ok: false, errorCode: res.errorCode || 'INVALID_INPUT' };
}

export async function logoutUser() {
  if (memoryAccessToken) {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  }
  memoryAccessToken = null;
}

export async function fetchUserSavedData() {
  if (!memoryAccessToken) return null;
  const res = await apiRequest('/api/user/data', { method: 'GET' });
  return res.ok ? res.data : null;
}

export async function saveUserSavedData({ favorit, itinerary }) {
  if (!memoryAccessToken) return false;
  const res = await apiRequest('/api/user/data', {
    method: 'PUT',
    body: JSON.stringify({ favorit, itinerary }),
  });
  return Boolean(res.ok);
}
