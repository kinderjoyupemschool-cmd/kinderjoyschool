/**
 * Live Dynamic Gallery Loader for Homepage
 * Loads dynamic photos saved from Admin while preserving original campus photos
 */
(function() {
  'use strict';

  async function loadDynamicGallery() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;

    try {
      const res = await fetch('/api/gallery');
      if (res.ok) {
        const json = await res.json();
        const items = json.data || [];
        if (items.length > 0) {
          items.forEach(photo => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'gallery-item';
            itemDiv.dataset.category = photo.category || 'annual-day';

            let catColor = '';
            if (photo.category === 'science-day') catColor = 'blue';
            else if (photo.category === 'award-ceremony') catColor = 'gold';

            let catLabel = 'Campus Event';
            if (photo.category === 'annual-day') catLabel = 'Annual Day';
            else if (photo.category === 'science-day') catLabel = 'Science Fair';
            else if (photo.category === 'award-ceremony') catLabel = 'Award Ceremony';
            else if (photo.category === 'sports') catLabel = 'Sports Meet';

            itemDiv.innerHTML = `
              <div class="gallery-card">
                <img src="${photo.imageUrl}" alt="${photo.title}" loading="lazy">
                <div class="gallery-overlay">
                  <span class="gallery-cat-badge ${catColor}">${catLabel}</span>
                  <h4>${photo.title}</h4>
                  ${photo.caption ? `<p>${photo.caption}</p>` : ''}
                </div>
              </div>
            `;
            // Insert at the front of gallery grid
            galleryGrid.insertBefore(itemDiv, galleryGrid.firstChild);
          });
        }
      }
    } catch (e) {
      // Offline fallback
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDynamicGallery);
  } else {
    loadDynamicGallery();
  }
})();

