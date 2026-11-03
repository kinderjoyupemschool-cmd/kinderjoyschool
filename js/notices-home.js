/**
 * Kinder Joy E.M.U.P. School - Home Notices & Calendar Logic
 * Renders Calendar INSTANTLY and synchronizes real-time updates seamlessly in the background.
 */

(function () {
  'use strict';

  let noticesList = [];
  let currentMonthDate = new Date(2026, 10, 1); // November 2026 default
  let selectedFilterDate = null;

  // DOM Elements
  const calMonthTitle = document.getElementById('calMonthTitle');
  const calPrevBtn = document.getElementById('calPrevBtn');
  const calNextBtn = document.getElementById('calNextBtn');
  const calendarDaysGrid = document.getElementById('calendarDaysGrid');
  const eventsItemsList = document.getElementById('eventsItemsList');
  const eventsPanelTitle = document.getElementById('eventsPanelTitle');
  const updatesCountPill = document.getElementById('updatesCountPill');

  const MONTH_NAMES = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const SHORT_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Format date helper: "01 Nov 2026, 09:30 AM"
  function formatPostedTime(dateInput) {
    if (!dateInput) return 'Recently';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Recently';
    const day = String(d.getDate()).padStart(2, '0');
    const month = SHORT_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? String(hours).padStart(2, '0') : '12';
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  }

  // 1. Load from localStorage synchronously (0ms latency)
  function loadLocalNotices() {
    try {
      const localSaved = JSON.parse(localStorage.getItem('kj_real_notices') || '[]');
      if (Array.isArray(localSaved) && localSaved.length > 0) {
        noticesList = localSaved.map(item => ({
          _id: item._id || item.id,
          title: item.title,
          category: item.category || 'General',
          type: item.type || 'news',
          eventDate: item.eventDate || item.publishDate,
          postedAt: item.publishDate || item.createdAt || new Date().toISOString(),
          content: item.content || '',
          redirectUrl: (item.category && item.category.toLowerCase() === 'exam') ? 'notices.html?exam=FA-2' : 'notices.html'
        }));
      }
    } catch (e) {}

    if (updatesCountPill) {
      updatesCountPill.textContent = `${noticesList.length} latest updates`;
    }
  }

  // 2. Fetch live notices asynchronously in the background
  async function fetchLiveNotices() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch('/api/notices', { cache: 'no-cache', signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : (json.data || []);
        if (Array.isArray(data)) {
          // Keep localStorage strictly in sync with the database
          try {
            localStorage.setItem('kj_real_notices', JSON.stringify(data));
          } catch (err) {}

          noticesList = data.map(item => ({
            _id: item._id || item.id,
            title: item.title,
            category: item.category || 'General',
            type: item.type || 'news',
            eventDate: item.eventDate || item.publishDate,
            postedAt: item.publishDate || item.createdAt || new Date().toISOString(),
            content: item.content || '',
            redirectUrl: (item.category && item.category.toLowerCase() === 'exam') ? 'notices.html?exam=FA-2' : 'notices.html'
          }));

          if (updatesCountPill) {
            updatesCountPill.textContent = `${noticesList.length} latest updates`;
          }

          renderCalendar();
          renderEvents();
        }
      }
    } catch (e) {
      // Offline fallback: already loaded from local data
    }
  }

  // Render Calendar Grid (Instantaneous)
  function renderCalendar() {
    if (!calendarDaysGrid || !calMonthTitle) return;

    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    calMonthTitle.textContent = `${MONTH_NAMES[month]} ${year} - ${String(year + 1).slice(2)}`;
    calendarDaysGrid.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Map of dates with events in this month
    const eventDatesMap = new Set();
    noticesList.forEach(n => {
      const d = new Date(n.eventDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        eventDatesMap.add(d.getDate());
      }
    });

    // Check today
    const now = new Date();
    const isCurrentMonth = (now.getFullYear() === year && now.getMonth() === month);
    const todayDate = now.getDate();

    // Empty cells before day 1
    for (let i = 0; i < firstDayIndex; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'cal-day-cell empty';
      calendarDaysGrid.appendChild(emptyCell);
    }

    // Days 1..daysInMonth
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';
      cell.textContent = day;

      if (isCurrentMonth && day === todayDate) {
        cell.classList.add('today');
      }

      const hasEvent = eventDatesMap.has(day);
      if (hasEvent) {
        cell.classList.add('has-event');
      }

      // Check if selected
      if (
        selectedFilterDate &&
        selectedFilterDate.getFullYear() === year &&
        selectedFilterDate.getMonth() === month &&
        selectedFilterDate.getDate() === day
      ) {
        cell.classList.add('active-selected');
      }

      cell.addEventListener('click', () => {
        if (
          selectedFilterDate &&
          selectedFilterDate.getFullYear() === year &&
          selectedFilterDate.getMonth() === month &&
          selectedFilterDate.getDate() === day
        ) {
          selectedFilterDate = null;
        } else {
          selectedFilterDate = new Date(year, month, day);
        }
        renderCalendar();
        renderEvents();
      });

      calendarDaysGrid.appendChild(cell);
    }
  }

  // Render Events List (Instantaneous)
  function renderEvents() {
    if (!eventsItemsList) return;

    const currentYear = currentMonthDate.getFullYear();
    const currentMonth = currentMonthDate.getMonth();

    let filtered = noticesList.filter(n => {
      const d = new Date(n.eventDate);
      if (selectedFilterDate) {
        return (
          d.getFullYear() === selectedFilterDate.getFullYear() &&
          d.getMonth() === selectedFilterDate.getMonth() &&
          d.getDate() === selectedFilterDate.getDate()
        );
      }
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    filtered.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    if (eventsPanelTitle) {
      if (selectedFilterDate) {
        eventsPanelTitle.textContent = `EVENTS ON ${selectedFilterDate.getDate()} ${MONTH_NAMES[selectedFilterDate.getMonth()]} ${selectedFilterDate.getFullYear()}`;
      } else {
        eventsPanelTitle.textContent = `ALL EVENTS IN ${MONTH_NAMES[currentMonth]}`;
      }
    }

    if (filtered.length === 0) {
      eventsItemsList.innerHTML = `
        <div class="empty-events-state" style="padding: 40px 20px; text-align: center;">
          <i class="far fa-bell-slash" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 12px; display: block;"></i>
          <h5 style="color: #64748b; margin-bottom: 6px; font-weight: 700;">No Official Notices Published Yet</h5>
          <p style="font-size: 0.88rem; color: #94a3b8; margin: 0; line-height: 1.5;">
            Official circulars, sports meets, and exam notifications published by the school administration will appear here in real-time.
          </p>
        </div>
      `;
      return;
    }

    eventsItemsList.innerHTML = '';

    filtered.forEach(item => {
      const evDate = new Date(item.eventDate);
      const monthStr = SHORT_MONTHS[evDate.getMonth()] || 'NOV';
      const dayNum = String(evDate.getDate()).padStart(2, '0');
      const cat = (item.category || 'general').toLowerCase();
      const catClass = `badge-${cat}`;
      const postedStr = formatPostedTime(item.postedAt);
      const isExam = (cat === 'exam' || (item.type && item.type.toLowerCase() === 'exam'));

      // Only exam circulars have clickable link to notices.html
      const card = document.createElement(isExam ? 'a' : 'div');
      card.className = `event-card-item ${isExam ? 'is-clickable' : 'is-static'}`;
      if (isExam) {
        card.href = 'notices.html';
        card.setAttribute('title', 'Click to view examination timetable & syllabus');
      }

      card.innerHTML = `
        <div class="event-date-block">
          <span class="event-month-txt">${monthStr}</span>
          <span class="event-day-num">${dayNum}</span>
        </div>
        <div class="event-content-col">
          <div class="event-meta-line">
            <span class="badge-category ${catClass}">${cat.toUpperCase()}</span>
            <span class="event-posted-time">
              <i class="far fa-clock"></i> Posted: ${postedStr}
            </span>
            <button type="button" class="btn-event-wa" title="Share circular on WhatsApp" style="margin-left: auto; background: none; border: none; color: #25D366; font-size: 1.1rem; cursor: pointer; padding: 2px 6px; display: inline-flex; align-items: center;">
              <i class="fab fa-whatsapp"></i>
            </button>
          </div>
          <h5 class="event-title-text">${item.title}</h5>
          ${item.content ? `<p class="event-desc-text">${item.content}</p>` : ''}
        </div>
        ${isExam ? `
          <div class="event-click-hint" title="View Timetable">
            <i class="fas fa-arrow-right"></i>
          </div>
        ` : ''}
      `;

      const waBtn = card.querySelector('.btn-event-wa');
      if (waBtn) {
        waBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const evDateStr = evDate.toLocaleDateString();
          let msg = `*🏫 KINDER JOY E.M.U.P. SCHOOL - RAYACHOTY*\n`;
          msg += `📢 *${item.title}*\n`;
          msg += `🏷️ Category: ${item.category || 'General'}\n`;
          msg += `📅 Date: ${evDateStr}\n`;
          if (item.content) msg += `📝 ${item.content}\n`;
          msg += `\n🔗 *School Website:* ${window.location.origin}`;

          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
          window.open(waUrl, '_blank');
        });
      }

      eventsItemsList.appendChild(card);
    });
  }

  // Prev / Next Month controls
  if (calPrevBtn) {
    calPrevBtn.addEventListener('click', () => {
      currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
      selectedFilterDate = null;
      renderCalendar();
      renderEvents();
    });
  }

  if (calNextBtn) {
    calNextBtn.addEventListener('click', () => {
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
      selectedFilterDate = null;
      renderCalendar();
      renderEvents();
    });
  }

  // Instant Launch Execution (0 milliseconds)
  function init() {
    loadLocalNotices();
    renderCalendar();
    renderEvents();
    fetchLiveNotices();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
