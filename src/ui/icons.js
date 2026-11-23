export function icon(name, size = 20) {
  const icons = {
    camera: '<path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 6h10a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2z"/>',
    cube: '<path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 7v10l9 5 9-5V7"/><path d="M12 12v10"/>',
    reset: '<path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    debug: '<path d="M8 2v3M16 2v3M3 10h18M5 7h14v11a2 2 0 01-2 2H7a2 2 0 01-2-2V7z"/><path d="M9 14h6M9 17h6"/>',
    switch: '<path d="M16 3h5v5M21 3l-6 6M8 21H3v-5M3 21l6-6"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`;
}
