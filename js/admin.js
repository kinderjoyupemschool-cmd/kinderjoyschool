/**
 * Kinder Joy E.M.U.P. School - Admin Portal JavaScript
 * Handles authentication, exam timetable builder, and notices publishing with Real-Time sync.
 */

(function () {
  'use strict';

  const TOKEN_KEY = 'kj_admin_token';

  // DOM Elements
  const logoutBtn = document.getElementById('logoutBtn');
  const actionStatusMsg = document.getElementById('actionStatusMsg');

  // Tabs
  const tabButtons = document.querySelectorAll('.admin-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Forms
  const scheduleForm = document.getElementById('scheduleForm');
  const schedAcademicYear = document.getElementById('schedAcademicYear');
  const schedClass = document.getElementById('schedClass');
  const schedExamType = document.getElementById('schedExamType');
  const schedTitle = document.getElementById('schedTitle');
  const schedInstructions = document.getElementById('schedInstructions');
  const addRowBtn = document.getElementById('addRowBtn');
  const matrixRowsContainer = document.getElementById('matrixRowsContainer');

  const noticeForm = document.getElementById('noticeForm');
  const noticeTitle = document.getElementById('noticeTitle');
  const noticeCategory = document.getElementById('noticeCategory');
  const noticeType = document.getElementById('noticeType');
  const noticeDate = document.getElementById('noticeDate');
  const noticeContent = document.getElementById('noticeContent');

  const manageNoticesList = document.getElementById('manageNoticesList');
  const manageSchedulesList = document.getElementById('manageSchedulesList');

  // ============================================================
  // FEATURE 4: CAMPUS GALLERY PHOTO MANAGER
  // ============================================================
  const galleryUploadForm = document.getElementById('galleryUploadForm');
  const galTitle = document.getElementById('galTitle');
  const galCategory = document.getElementById('galCategory');
  const galPhotoFile = document.getElementById('galPhotoFile');
  const galCaption = document.getElementById('galCaption');
  const manageGalleryList = document.getElementById('manageGalleryList');

  async function loadGalleryAdmin() {
    if (!manageGalleryList) return;
    try {
      const res = await fetch('/api/gallery');
      if (res.ok) {
        const json = await res.json();
        const items = json.data || [];
        if (items.length > 0) {
          manageGalleryList.innerHTML = '';
          items.forEach(photo => {
            const card = document.createElement('div');
            card.className = 'admin-manage-item';
            card.innerHTML = `
              <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                <img src="${photo.imageUrl}" alt="${photo.title}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 8px; border: 1.5px solid #e2e8f0;">
                <div style="flex: 1; min-width: 0;">
                  <strong style="display: block; font-size: 0.92rem; color: #0f1c2e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${photo.title}</strong>
                  <span class="admin-manage-badge" style="margin: 3px 0 0 0;">${photo.category || 'General'}</span>
                  ${photo.caption ? `<div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">${photo.caption}</div>` : ''}
                </div>
              </div>
              <button class="admin-btn-danger" style="cursor: pointer;"><i class="fas fa-trash-alt"></i> Delete</button>
            `;
            card.querySelector('button').addEventListener('click', () => deleteGalleryPhoto(photo._id));
            manageGalleryList.appendChild(card);
          });
        } else {
          manageGalleryList.innerHTML = '<p style="color: #94a3b8; font-size: 0.88rem;">No uploaded event photos yet. Upload photos using the form on the left.</p>';
        }
      }
    } catch (e) {}
  }

  if (galleryUploadForm) {
    galleryUploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem(TOKEN_KEY);
      if (!galPhotoFile.files || !galPhotoFile.files[0]) {
        alert('Please choose an image file to upload.');
        return;
      }

      const formData = new FormData();
      formData.append('title', galTitle.value.trim());
      formData.append('category', galCategory.value);
      formData.append('caption', galCaption.value.trim());
      formData.append('photo', galPhotoFile.files[0]);

      try {
        const res = await fetch('/api/gallery', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        if (res.ok) {
          showStatus('Photo uploaded successfully to homepage gallery!', 'success');
          galleryUploadForm.reset();
          loadGalleryAdmin();
        } else {
          const err = await res.json();
          showStatus(err.message || 'Upload failed.', 'error');
        }
      } catch (err) {
        showStatus('Network error during upload.', 'error');
      }
    });
  }

  async function deleteGalleryPhoto(id) {
    if (!confirm('Are you sure you want to remove this photo from the school gallery?')) return;
    const token = localStorage.getItem(TOKEN_KEY);
    try {
      await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      showStatus('Photo deleted from gallery.', 'success');
      loadGalleryAdmin();
    } catch (e) {}
  }

  // Initial Auth Check - Redirects to dedicated login.html if not authenticated
  function checkAuth() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      window.location.replace('login.html');
    } else {
      loadManageData();
    }
  }

  // Handle Logout
  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.replace('login.html');
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  const topbarLogoutBtn = document.getElementById('topbarLogoutBtn');
  if (topbarLogoutBtn) {
    topbarLogoutBtn.addEventListener('click', handleLogout);
  }

  // Tab switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.style.display = 'none');

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.style.display = 'block';

      if (targetId === 'tabManage') {
        loadManageData();
      } else if (targetId === 'tabGallery') {
        loadGalleryAdmin();
      }
    });
  });

  function showStatus(msg, type = 'success') {
    if (!actionStatusMsg) return;
    actionStatusMsg.textContent = msg;
    actionStatusMsg.className = `status-msg ${type === 'success' ? 'status-success' : 'status-error'}`;
    actionStatusMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      actionStatusMsg.style.display = 'none';
    }, 5000);
  }

  // Dynamic Timetable Matrix Row Generator (Clean, spacious, responsive & easy to use)
  function createMatrixRow(date = '', day = '', subject = '', timing = '09:30 AM - 11:30 AM', portion = '') {
    const row = document.createElement('div');
    row.className = 'schedule-matrix-card';

    row.innerHTML = `
      <div class="matrix-card-header">
        <span class="matrix-card-number"><i class="fas fa-book-open"></i> Subject Entry</span>
        <button type="button" class="matrix-remove-btn remove-row-btn" title="Remove this subject row">
          <i class="fas fa-trash-alt"></i> <span>Remove</span>
        </button>
      </div>

      <div class="matrix-grid-fields">
        <!-- Date (Calendar Picker with Auto Day Calculation) -->
        <div class="m-field">
          <label class="m-label"><i class="far fa-calendar-alt"></i> Exam Date</label>
          <input type="date" class="admin-form-input r-date" value="${date}" required>
        </div>

        <!-- Day of Week (Auto detected from calendar date or overrideable) -->
        <div class="m-field">
          <label class="m-label"><i class="far fa-clock"></i> Day of Week</label>
          <input type="text" class="admin-form-input r-day" placeholder="Auto-fills from date" value="${day}" readonly style="background: #f1f5f9; cursor: not-allowed; color: #334155; font-weight: 700;">
        </div>

        <!-- Subject -->
        <div class="m-field">
          <label class="m-label"><i class="fas fa-graduation-cap"></i> Subject</label>
          <input type="text" class="admin-form-input r-subject" placeholder="e.g. Mathematics" value="${subject}" required>
        </div>

        <!-- Timing (Start Time to End Time) -->
        <div class="m-field">
          <label class="m-label"><i class="fas fa-stopwatch"></i> Exam Timing</label>
          <div class="time-range-wrap">
            <input type="time" class="admin-form-input r-start-time" value="09:30" required>
            <span class="time-separator">to</span>
            <input type="time" class="admin-form-input r-end-time" value="11:30" required>
          </div>
        </div>

        <!-- Syllabus / Portion Full Width -->
        <div class="m-field m-field-full">
          <label class="m-label"><i class="fas fa-list-ul"></i> Syllabus / Portion Covered</label>
          <input type="text" class="admin-form-input r-portion" placeholder="e.g. Units 1 to 4: Addition, Subtraction, Multiplication tables up to 12" value="${portion}">
        </div>
      </div>
    `;

    // Auto calculate Day of Week when Date changes
    const dateInput = row.querySelector('.r-date');
    const dayInput = row.querySelector('.r-day');
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    dateInput.addEventListener('change', () => {
      if (dateInput.value) {
        const d = new Date(dateInput.value + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          dayInput.value = DAYS[d.getDay()];
        }
      } else {
        dayInput.value = '';
      }
    });

    // Parse initial timing into start and end inputs if provided
    if (timing && timing.includes('-')) {
      const parts = timing.split('-').map(s => s.trim());
      if (parts.length === 2) {
        const start24 = parseTo24Hour(parts[0]);
        const end24 = parseTo24Hour(parts[1]);
        if (start24) row.querySelector('.r-start-time').value = start24;
        if (end24) row.querySelector('.r-end-time').value = end24;
      }
    }

    row.querySelector('.remove-row-btn').addEventListener('click', () => {
      if (matrixRowsContainer.children.length > 1) {
        row.remove();
        updateRowNumbers();
      } else {
        alert('At least one subject row is required.');
      }
    });

    return row;
  }

  // Convert 12-hour AM/PM to 24-hour HH:MM
  function parseTo24Hour(timeStr) {
    if (!timeStr) return '';
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return timeStr.includes(':') ? timeStr.slice(0, 5) : '';
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const modifier = (match[3] || '').toUpperCase();
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  // Convert 24-hour HH:MM to friendly 12-hour display "09:30 AM"
  function formatTo12Hour(time24) {
    if (!time24) return '';
    const parts = time24.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  }

  // Helper to format date string into nice display like "17 Nov 2026"
  function formatExamDateDisplay(dateStr) {
    if (!dateStr) return '';
    // If already in text format (e.g. "17 Nov 2026"), keep as is
    if (/^[0-9]{1,2}\s+[A-Za-z]{3}\s+[0-9]{4}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    if (isNaN(d.getTime())) return dateStr;
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  function updateRowNumbers() {
    if (!matrixRowsContainer) return;
    const cards = matrixRowsContainer.querySelectorAll('.schedule-matrix-card');
    cards.forEach((card, index) => {
      const numSpan = card.querySelector('.matrix-card-number');
      if (numSpan) {
        numSpan.innerHTML = `<i class="fas fa-book-open"></i> Subject ${index + 1}`;
      }
    });
  }

  function initDefaultMatrix() {
    if (!matrixRowsContainer) return;
    matrixRowsContainer.innerHTML = '';
    // Start with 4 clean empty rows ready for admin entry
    matrixRowsContainer.appendChild(createMatrixRow('', '', '', '09:30 AM - 11:30 AM', ''));
    matrixRowsContainer.appendChild(createMatrixRow('', '', '', '09:30 AM - 11:30 AM', ''));
    matrixRowsContainer.appendChild(createMatrixRow('', '', '', '09:30 AM - 11:30 AM', ''));
    matrixRowsContainer.appendChild(createMatrixRow('', '', '', '09:30 AM - 11:30 AM', ''));
    updateRowNumbers();
  }

  if (addRowBtn) {
    addRowBtn.addEventListener('click', () => {
      matrixRowsContainer.appendChild(createMatrixRow());
      updateRowNumbers();
    });
  }

  let cachedExistingSchedules = [];

  // Check if current Class + Assessment already has a timetable and auto-load it
  function checkAndAutoLoadExistingSchedule() {
    if (!schedAcademicYear || !schedClass || !schedExamType) return;
    const year = schedAcademicYear.value.trim();
    const cls = schedClass.value;
    const type = schedExamType.value;

    if (!cls || !type) {
      if (schedTitle) schedTitle.value = '';
      return;
    }

    const existing = cachedExistingSchedules.find(s =>
      s.academicYear === year &&
      s.className === cls &&
      s.examType === type
    );

    const submitBtn = scheduleForm ? scheduleForm.querySelector('button[type="submit"]') : null;

    if (existing) {
      // Pre-load existing rows so user sees what is already created
      if (matrixRowsContainer) {
        matrixRowsContainer.innerHTML = '';
        const items = existing.timetable || existing.subjects || [];
        if (items.length > 0) {
          items.forEach(item => {
            matrixRowsContainer.appendChild(createMatrixRow(
              item.date || '',
              item.day || '',
              item.subject || '',
              item.time || '09:30 AM - 11:30 AM',
              item.portion || item.syllabus || ''
            ));
          });
        }
        updateRowNumbers();
      }
      if (schedTitle) schedTitle.value = existing.timingNote || `${type} Assessment - ${cls} Schedule`;
      if (schedInstructions && existing.instructions) {
        schedInstructions.value = Array.isArray(existing.instructions) ? existing.instructions.join('\n') : existing.instructions;
      }
      if (submitBtn) {
        submitBtn.innerHTML = `<i class="fas fa-sync-alt"></i> Update Existing ${type} Timetable for ${cls}`;
        submitBtn.style.background = '#0a4f8a';
      }
      showStatus(`ℹ️ Found existing ${type} timetable for ${cls}. Its contents have been loaded below for updating.`, 'success');
    } else {
      if (submitBtn) {
        submitBtn.innerHTML = `<i class="fas fa-check-circle"></i> Save &amp; Publish Timetable Live`;
        submitBtn.style.background = '';
      }
      updateScheduleTitle();
    }
  }

  // Update schedule title dynamically when class or exam type changes
  function updateScheduleTitle() {
    if (schedTitle && schedClass && schedExamType) {
      if (schedClass.value && schedExamType.value) {
        schedTitle.value = `${schedExamType.value} Assessment - ${schedClass.value} Schedule`;
      } else {
        schedTitle.value = '';
      }
    }
  }

  if (schedClass) schedClass.addEventListener('change', checkAndAutoLoadExistingSchedule);
  if (schedExamType) schedExamType.addEventListener('change', checkAndAutoLoadExistingSchedule);
  if (schedAcademicYear) schedAcademicYear.addEventListener('change', checkAndAutoLoadExistingSchedule);

  // Submit Schedule Form (Real-Time Synchronized)
  if (scheduleForm) {
    scheduleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        if (loginModal) loginModal.style.display = 'flex';
        return;
      }

      const rows = matrixRowsContainer.querySelectorAll('.schedule-matrix-card');
      const timetable = [];

      rows.forEach(r => {
        const rawDate = r.querySelector('.r-date').value.trim();
        const date = formatExamDateDisplay(rawDate);
        const day = r.querySelector('.r-day').value.trim();
        const subject = r.querySelector('.r-subject').value.trim();
        const startVal = r.querySelector('.r-start-time').value;
        const endVal = r.querySelector('.r-end-time').value;
        const time = (startVal && endVal) ? `${formatTo12Hour(startVal)} - ${formatTo12Hour(endVal)}` : '09:30 AM - 11:30 AM';
        const syllabus = r.querySelector('.r-portion').value.trim();

        if (subject && date) {
          timetable.push({ date, day, time, subject, syllabus });
        }
      });

      if (timetable.length === 0) {
        showStatus('Please provide at least one subject with a Date and Subject Name.', 'error');
        return;
      }

      const instructionsArr = schedInstructions.value.trim().split('\n').filter(Boolean);

      const payload = {
        academicYear: schedAcademicYear.value.trim(),
        className: schedClass.value,
        examType: schedExamType.value,
        timingNote: schedTitle.value.trim(),
        instructions: instructionsArr,
        timetable: timetable
      };

      // 1. Post to backend API first
      let savedSched = null;
      try {
        const res = await fetch('/api/schedules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const json = await res.json();
          savedSched = json.data || json;
        }
      } catch (e) {}

      // 2. Sync to localStorage using consistent identity to guarantee 1 single entry
      try {
        const localSchedules = JSON.parse(localStorage.getItem('kj_real_schedules') || '[]');
        const idx = localSchedules.findIndex(s =>
          s.academicYear === payload.academicYear &&
          s.className === payload.className &&
          s.examType === payload.examType
        );
        const schedId = (savedSched && savedSched._id) ? savedSched._id : (idx >= 0 ? localSchedules[idx]._id : ('sched-' + Date.now()));
        const savedObj = { _id: schedId, ...payload, updatedAt: new Date().toISOString() };
        if (idx >= 0) {
          localSchedules[idx] = savedObj;
        } else {
          localSchedules.push(savedObj);
        }
        localStorage.setItem('kj_real_schedules', JSON.stringify(localSchedules));
      } catch (err) {}

      showStatus(`Timetable for ${payload.className} (${payload.examType}, ${payload.academicYear}) saved live!`, 'success');
      loadManageData();
    });
  }

  // Submit Notice Form (Real-Time Synchronized)
  if (noticeForm) {
    if (noticeDate) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      noticeDate.value = now.toISOString().slice(0, 16);
    }

    noticeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        if (loginModal) loginModal.style.display = 'flex';
        return;
      }

      const chosenCat = noticeCategory ? noticeCategory.value : 'General';
      let derivedType = 'event';
      if (chosenCat.toLowerCase() === 'exam') derivedType = 'exam';
      else if (chosenCat.toLowerCase() === 'urgent') derivedType = 'urgent';
      else if (chosenCat.toLowerCase() === 'general') derivedType = 'general';

      const payload = {
        title: noticeTitle.value.trim(),
        category: chosenCat,
        type: derivedType,
        eventDate: noticeDate.value ? new Date(noticeDate.value).toISOString() : new Date().toISOString(),
        content: noticeContent.value.trim(),
        publishDate: new Date().toISOString()
      };

      // 1. Post to backend API first
      let savedNotice = null;
      try {
        const res = await fetch('/api/notices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const json = await res.json();
          savedNotice = json.data || json;
        }
      } catch (e) {}

      // 2. Sync to localStorage using the official server _id to guarantee no duplicate copies
      try {
        const localNotices = JSON.parse(localStorage.getItem('kj_real_notices') || '[]');
        const noticeId = (savedNotice && savedNotice._id) ? savedNotice._id : ('notice-' + Date.now());
        const newNoticeObj = {
          _id: noticeId,
          ...payload
        };
        // Avoid duplicate by id or identical title & content
        const exists = localNotices.some(n =>
          (n._id === noticeId) ||
          (n.title === payload.title && n.content === payload.content && Math.abs(new Date(n.publishDate || 0) - new Date(payload.publishDate)) < 5000)
        );
        if (!exists) {
          localNotices.unshift(newNoticeObj);
          localStorage.setItem('kj_real_notices', JSON.stringify(localNotices));
        }
      } catch (err) {}

      showStatus(`Notice "${payload.title}" published live to homepage!`, 'success');
      noticeForm.reset();
      loadManageData();
    });
  }

  // Manage Data: Load Notices & Schedules for deletion / inspection & Dashboard metrics
  async function loadManageData() {
    let notices = [];
    // API
    try {
      const res = await fetch('/api/notices');
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : (json.data || []);
        if (Array.isArray(data)) notices = [...data];
      }
    } catch (e) {}

    // Deduplicate notices before rendering
    const uniqueNotices = [];
    const seenNoticeKeys = new Set();
    notices.forEach(n => {
      const id = n._id || n.id;
      const contentKey = `${n.title}_${n.category}_${(n.content || '').slice(0, 40)}`;
      if (id && !seenNoticeKeys.has(id) && !seenNoticeKeys.has(contentKey)) {
        seenNoticeKeys.add(id);
        seenNoticeKeys.add(contentKey);
        uniqueNotices.push(n);
      }
    });
    notices = uniqueNotices;

    // Update Dashboard Metric for notices
    const statNoticesCount = document.getElementById('statNoticesCount');
    if (statNoticesCount) statNoticesCount.textContent = notices.length;

    // Render Recent Circulars in Dashboard Overview (All circulars loaded into smooth scrollable container)
    const quickRecentNoticesList = document.getElementById('quickRecentNoticesList');
    if (quickRecentNoticesList) {
      if (notices.length > 0) {
        quickRecentNoticesList.innerHTML = '';
        notices.forEach(n => {
          const item = document.createElement('div');
          item.className = 'dash-feed-item';
          item.innerHTML = `
            <div class="dash-feed-left">
              <div class="dash-feed-icon"><i class="fas fa-bullhorn"></i></div>
              <div style="flex: 1; min-width: 0;">
                <h5 class="dash-feed-title">${n.title}</h5>
                <span class="dash-feed-meta">${new Date(n.eventDate).toLocaleDateString()} • ${n.category || 'General'}</span>
                ${n.content ? `<div style="font-size: 0.8rem; color: #475569; margin-top: 4px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${n.content}</div>` : ''}
              </div>
            </div>
            <span class="feed-status-badge badge-complete" style="align-self: flex-start;">Live</span>
          `;
          quickRecentNoticesList.appendChild(item);
        });
      } else {
        quickRecentNoticesList.innerHTML = '<p style="color: #94a3b8; font-size: 0.88rem; margin: 0; padding: 16px 0;">No notices published yet. Use "+ New Notice" to publish live circulars.</p>';
      }
    }

    if (manageNoticesList) {
      if (notices.length > 0) {
        manageNoticesList.innerHTML = '';
        notices.forEach(n => {
          const item = document.createElement('div');
          item.className = 'admin-manage-item';
          item.innerHTML = `
            <div class="admin-manage-info">
              <strong>${n.title}</strong>
              <span class="admin-manage-badge">${n.category}</span>
              <div class="admin-manage-date"><i class="fas fa-calendar-day"></i> Event Date: ${new Date(n.eventDate).toLocaleDateString()}</div>
              ${n.content ? `<div style="font-size: 0.84rem; color: #475569; margin-top: 6px; line-height: 1.45; background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">${n.content}</div>` : ''}
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn-dash-secondary admin-manage-edit-btn" style="padding: 7px 14px; font-size: 0.82rem; border-radius: 8px; color: #0a4f8a; font-weight: 700; border: 1px solid #cbd5e1; background: #ffffff; cursor: pointer;">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="admin-btn-danger admin-manage-del-btn" data-id="${n._id}"><i class="fas fa-trash-alt"></i> Delete</button>
            </div>
          `;
          item.querySelector('.admin-manage-edit-btn').addEventListener('click', () => openEditNoticeModal(n));
          item.querySelector('.admin-manage-del-btn').addEventListener('click', () => deleteNotice(n._id));
          manageNoticesList.appendChild(item);
        });
      } else {
        manageNoticesList.innerHTML = '<p style="color: #94a3b8;">No notices posted yet. Use the "Publish Notices" tab to add official circulars.</p>';
      }
    }

    // Schedules
    let schedules = [];
    try {
      const res = await fetch('/api/schedules');
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : (json.data || []);
        if (Array.isArray(data)) schedules = [...data];
      }
    } catch (e) {}

    // Deduplicate schedules before rendering
    const uniqueSchedules = [];
    const seenSchedKeys = new Set();
    schedules.forEach(s => {
      const id = s._id || s.id;
      const matrixKey = `${s.academicYear}_${s.className}_${s.examType}`;
      if (id && !seenSchedKeys.has(id) && !seenSchedKeys.has(matrixKey)) {
        seenSchedKeys.add(id);
        seenSchedKeys.add(matrixKey);
        uniqueSchedules.push(s);
      }
    });
    schedules = uniqueSchedules;
    cachedExistingSchedules = schedules;

    // Update Dashboard Metric for schedules
    const statSchedulesCount = document.getElementById('statSchedulesCount');
    if (statSchedulesCount) statSchedulesCount.textContent = schedules.length;

    if (manageSchedulesList) {
      if (schedules.length > 0) {
        manageSchedulesList.innerHTML = '';
        schedules.forEach(s => {
          const item = document.createElement('div');
          item.className = 'admin-manage-item';
          const count = s.timetable ? s.timetable.length : (s.subjects ? s.subjects.length : 0);
          item.innerHTML = `
            <div class="admin-manage-info">
              <strong>${s.className} - ${s.examType}</strong> <span style="color: #64748b; font-size: 0.88rem;">(${s.academicYear})</span>
              <div class="admin-manage-date"><i class="fas fa-book-open"></i> ${count} subjects scheduled</div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn-dash-secondary admin-manage-sched-edit-btn" style="padding: 7px 14px; font-size: 0.82rem; border-radius: 8px; color: #0a4f8a; font-weight: 700; border: 1px solid #cbd5e1; background: #ffffff; cursor: pointer;">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="admin-btn-danger admin-manage-del-btn" data-id="${s._id}"><i class="fas fa-trash-alt"></i> Delete</button>
            </div>
          `;
          item.querySelector('.admin-manage-sched-edit-btn').addEventListener('click', () => loadScheduleIntoEditor(s));
          item.querySelector('.admin-manage-del-btn').addEventListener('click', () => deleteSchedule(s._id));
          manageSchedulesList.appendChild(item);
        });
      } else {
        manageSchedulesList.innerHTML = '<p style="color: #94a3b8;">No class exam timetables saved yet. Use the "Exam Timetables" tab to create one.</p>';
      }
    }
  }

  // Notice Edit Modal Logic
  const editNoticeModal = document.getElementById('editNoticeModal');
  const closeEditModalBtn = document.getElementById('closeEditModalBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const editNoticeForm = document.getElementById('editNoticeForm');
  const editNoticeId = document.getElementById('editNoticeId');
  const editNoticeTitle = document.getElementById('editNoticeTitle');
  const editNoticeCategory = document.getElementById('editNoticeCategory');
  const editNoticeDate = document.getElementById('editNoticeDate');
  const editNoticeContent = document.getElementById('editNoticeContent');

  function openEditNoticeModal(notice) {
    if (!editNoticeModal) return;
    editNoticeId.value = notice._id || notice.id;
    editNoticeTitle.value = notice.title || '';
    if (editNoticeCategory) {
      const matchOpt = Array.from(editNoticeCategory.options).find(o => o.value.toLowerCase() === (notice.category || '').toLowerCase());
      if (matchOpt) editNoticeCategory.value = matchOpt.value;
      else editNoticeCategory.value = 'General';
    }
    if (editNoticeDate) {
      const d = notice.eventDate ? new Date(notice.eventDate) : new Date();
      editNoticeDate.value = d.toISOString().split('T')[0];
    }
    if (editNoticeContent) {
      editNoticeContent.value = notice.content || '';
    }
    editNoticeModal.style.display = 'flex';
  }

  function closeEditModal() {
    if (editNoticeModal) editNoticeModal.style.display = 'none';
  }

  if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditModal);
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);

  if (editNoticeForm) {
    editNoticeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem(TOKEN_KEY);
      const id = editNoticeId.value;
      if (!id) return;

      const chosenCat = editNoticeCategory ? editNoticeCategory.value : 'General';
      let derivedType = 'event';
      if (chosenCat.toLowerCase() === 'exam') derivedType = 'exam';
      else if (chosenCat.toLowerCase() === 'urgent') derivedType = 'urgent';
      else if (chosenCat.toLowerCase() === 'general') derivedType = 'general';

      const updatedPayload = {
        title: editNoticeTitle.value.trim(),
        category: chosenCat,
        type: derivedType,
        eventDate: editNoticeDate.value ? new Date(editNoticeDate.value).toISOString() : new Date().toISOString(),
        content: editNoticeContent.value.trim()
      };

      // 1. Update API / MongoDB Atlas
      try {
        await fetch(`/api/notices/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedPayload)
        });
      } catch (err) {}

      // 2. Update localStorage
      try {
        let localNotices = JSON.parse(localStorage.getItem('kj_real_notices') || '[]');
        const idx = localNotices.findIndex(n => (n._id || n.id) === id);
        if (idx !== -1) {
          localNotices[idx] = { ...localNotices[idx], ...updatedPayload };
          localStorage.setItem('kj_real_notices', JSON.stringify(localNotices));
        }
      } catch (err) {}

      closeEditModal();
      showStatus(`Notice "${updatedPayload.title}" updated successfully!`, 'success');
      loadManageData();
    });
  }

  async function deleteNotice(id) {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    const token = localStorage.getItem(TOKEN_KEY);

    // Delete from localStorage
    try {
      let localNotices = JSON.parse(localStorage.getItem('kj_real_notices') || '[]');
      localNotices = localNotices.filter(n => (n._id || n.id) !== id);
      localStorage.setItem('kj_real_notices', JSON.stringify(localNotices));
    } catch (err) {}

    // Delete from API
    try {
      await fetch(`/api/notices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}

    showStatus('Notice deleted in real-time.', 'success');
    loadManageData();
  }

  async function deleteSchedule(id) {
    if (!confirm('Are you sure you want to delete this timetable?')) return;
    const token = localStorage.getItem(TOKEN_KEY);

    // Delete from localStorage
    try {
      let localSchedules = JSON.parse(localStorage.getItem('kj_real_schedules') || '[]');
      localSchedules = localSchedules.filter(s => (s._id || s.id) !== id);
      localStorage.setItem('kj_real_schedules', JSON.stringify(localSchedules));
    } catch (err) {}

    // Delete from API
    try {
      await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}

    showStatus('Timetable deleted in real-time.', 'success');
    loadManageData();
  }

  // Load an existing schedule into the editor for editing
  function loadScheduleIntoEditor(s) {
    if (!s) return;
    activateTab('tabSchedule');

    if (schedAcademicYear) schedAcademicYear.value = s.academicYear || '2026-2027';
    if (schedClass) schedClass.value = s.className || 'Class 3';
    if (schedExamType) schedExamType.value = s.examType || 'FA-2';
    if (schedTitle) schedTitle.value = s.timingNote || `${s.examType} Assessment - ${s.className} Schedule`;

    if (schedInstructions) {
      if (Array.isArray(s.instructions)) {
        schedInstructions.value = s.instructions.join('\n');
      } else if (typeof s.instructions === 'string') {
        schedInstructions.value = s.instructions;
      }
    }

    if (matrixRowsContainer) {
      matrixRowsContainer.innerHTML = '';
      const items = s.timetable || s.subjects || [];
      if (items.length > 0) {
        items.forEach(item => {
          matrixRowsContainer.appendChild(createMatrixRow(
            item.date || '',
            item.day || '',
            item.subject || '',
            item.time || '09:30 AM - 11:30 AM',
            item.portion || item.syllabus || ''
          ));
        });
      } else {
        initDefaultMatrix();
      }
      updateRowNumbers();
    }

    showStatus(`Editing timetable for ${s.className} (${s.examType}). Make changes and click Save & Publish.`, 'success');
  }

  // Switch tab programmatically
  function activateTab(tabId) {
    tabButtons.forEach(b => {
      if (b.dataset.tab === tabId) b.classList.add('active');
      else b.classList.remove('active');
    });
    tabPanes.forEach(p => p.style.display = 'none');
    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.style.display = 'block';

    if (tabId === 'tabManage' || tabId === 'tabDashboard') {
      loadManageData();
    }
  }

  // Quick Action Buttons
  const btnQuickCreateNotice = document.getElementById('btnQuickCreateNotice');
  if (btnQuickCreateNotice) {
    btnQuickCreateNotice.addEventListener('click', () => activateTab('tabNotice'));
  }

  const btnQuickCreateSchedule = document.getElementById('btnQuickCreateSchedule');
  if (btnQuickCreateSchedule) {
    btnQuickCreateSchedule.addEventListener('click', () => activateTab('tabSchedule'));
  }

  const btnGoToSchedules = document.getElementById('btnGoToSchedules');
  if (btnGoToSchedules) {
    btnGoToSchedules.addEventListener('click', () => activateTab('tabSchedule'));
  }

  // Mobile Sidebar Toggle & Overlay Handling
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const dashSidebar = document.getElementById('dashSidebar');

  function openSidebar() {
    if (dashSidebar) dashSidebar.classList.add('open');
    if (sidebarOverlay) sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (dashSidebar) dashSidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', openSidebar);
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', closeSidebar);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  // Close sidebar when navigating via menu item on mobile
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        closeSidebar();
      }
    });
  });

  // Live Portal Clock
  function startPortalClock() {
    const liveClockEl = document.getElementById('livePortalClock');
    if (!liveClockEl) return;
    function updateClock() {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 becomes 12
      const strHours = String(hours).padStart(2, '0');
      liveClockEl.textContent = `${strHours}:${minutes}:${seconds} ${ampm}`;
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initDefaultMatrix();
    startPortalClock();
  });
})();
