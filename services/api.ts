
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL não definida');
}

interface RequestOptions {
  token?: string;
  body?: any;
  isFormData?: boolean;
}

async function handleResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Erro na requisição');
  }
  return data;
}

export const apiService = {
  get: async (endpoint: string, token?: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      }
    });
    return handleResponse(response);
  },

  post: async (endpoint: string, { body, token, isFormData }: RequestOptions = {}) => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let requestBody;
    if (isFormData) {
      requestBody = body; // body is already a URLSearchParams or FormData
    } else {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: requestBody
    });
    return handleResponse(response);
  },

  put: async (endpoint: string, { body, token }: RequestOptions = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(body)
    });
    return handleResponse(response);
  },

  delete: async (endpoint: string, token?: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      }
    });
    return handleResponse(response);
  }
};
