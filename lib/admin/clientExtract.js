async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function callExtractionRoute(path, file, extraBody = {}) {
  const base64 = await fileToBase64(file);
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mediaType: file.type || 'image/jpeg', ...extraBody }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Extraction failed.');
  return data;
}

export async function extractListing(file) {
  return callExtractionRoute('/api/admin/extract-listing', file);
}

export async function extractSizeChart(file, category) {
  return callExtractionRoute('/api/admin/extract-size-chart', file, { category });
}
