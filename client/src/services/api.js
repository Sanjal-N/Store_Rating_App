const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// A thin wrapper around fetch that adds the auth token, JSON headers,
// and turns non-2xx responses into thrown errors with a useful message.
async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error('Could not reach the server. Please check your connection.');
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // non-JSON response - fall through with data = null
    }
  }

  if (!response.ok) {
    throw new Error((data && data.message) || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  get: (path, token) => request(path, { token }),
  post: (path, body, token) => request(path, { method: 'POST', body, token }),
  put: (path, body, token) => request(path, { method: 'PUT', body, token }),
};
