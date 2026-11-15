import { toolFetch } from './toolAccess'
import {API_BASE_URL as API} from './config';

export async function generatePresentation({ topic, slideCount, signal }) {
  const response = await toolFetch(`${API}/presentation/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, slideCount }),
    signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success || !Array.isArray(data.presentation?.slides) || data.presentation.slides.length !== slideCount) {
    throw new Error(data.message || 'The presentation could not be generated. Please try again.');
  }
  return data.presentation;
}
