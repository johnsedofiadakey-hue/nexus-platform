export async function safeJson(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    // Try to extract body for debugging
    let bodyText = '';
    try { bodyText = await response.text(); } catch (e) { bodyText = '<no body>'; }
    throw new Error(`HTTP ${response.status}: ${bodyText}`);
  }
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error('Expected JSON but received: ' + text.slice(0, 1000));
  }
  return response.json();
}
