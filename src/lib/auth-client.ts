import { supabase } from './supabase';

// Client-side helper to make authenticated API calls
export async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      throw new Error('No valid session found');
    }

    // Add authorization header
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('Authenticated request failed:', error);
    throw error;
  }
}

// Helper for GET requests
export async function authenticatedGet(url: string) {
  const response = await makeAuthenticatedRequest(url, { method: 'GET' });
  return response.json();
}

// Helper for POST requests
export async function authenticatedPost(url: string, data: any) {
  const response = await makeAuthenticatedRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

// Helper for PATCH requests
export async function authenticatedPatch(url: string, data: any) {
  const response = await makeAuthenticatedRequest(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.json();
}

// Helper for DELETE requests
export async function authenticatedDelete(url: string) {
  const response = await makeAuthenticatedRequest(url, { method: 'DELETE' });
  return response.json();
}