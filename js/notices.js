/**
 * Kinder Joy E.M.U.P. School - Dedicated Exam Portal Logic
 * Super Clean 2-Dropdown Filter: Class -> Assessment Type
 * Academic year is maintained automatically in the background (2026-2027).
 */

(function () {
  'use strict';

  // State
  let currentClass = '';
  let currentExam = '';
  const currentAcademicYear = '2026-2027'; // Managed automatically

  // DOM Elements
  const classSelect = document.getElementById('classSelect');
  const examSelect = document.getElementById('examSelect');
  const printTimetableBtn = document.getElementById('printTimetableBtn');

  const timetableTitle = document.getElementById('timetableTitle');
  const examDateRangeBadge = document.getElementById('examDateRangeBadge');
  const timetableBody = document.getElementById('timetableBody');
  const timetableTable = document.getElementById('timetableTable');
  const examInstructionsBox = document.getElementById('examInstructionsBox');
  const instructionsList = document.getElementById('instructionsList');

  // Helper to read URL query params (e.g. ?class=Class%203&exam=FA-2)
  function parseQueryParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('class')) {
      const cls = params.get('class');
      if (cls) currentClass = cls;
    }
    if (params.has('exam')) {
      const ex = params.get('exam');
      if (ex) currentExam = ex.toUpperCase();
    }
  }

  // Fetch & Render Real-Time Timetable (Instantaneous 0ms)
  function renderTimetable() {
    if (!currentClass || !currentExam) {
      if (timetableTitle) {
        timetableTitle.innerHTML = `<i class="fas fa-clipboard-list" style="margin-right: 8px; color: #ffd166;"></i> Select Class and Assessment to View Timetable`;
      }
      if (examDateRangeBadge) {
        examDateRangeBadge.textContent = 'Please choose options';
      }
      displayScheduleState(null, null, true);
      return;
    }

    if (timetableTitle) {
      timetableTitle.innerHTML = `<i class="fas fa-clipboard-list" style="margin-right: 8px; color: #ffd166;"></i> ${currentClass} - ${currentExam} Examination Schedule`;
    }

    let rows = null;
    let instructions = null;

    // Check localStorage immediately (0ms)
    try {
      const localSchedules = JSON.parse(localStorage.getItem('kj_real_schedules') || '[]');
      const match = localSchedules.find(s =>
        (s.academicYear === currentAcademicYear || !s.academicYear) &&
        s.className === currentClass &&
        s.examType === currentExam
      );
      if (match && match.timetable && match.timetable.length > 0) {
        rows = match.timetable.map(s => ({
          date: s.date || '',
          day: s.day || '',
          timing: s.time || s.timing || '09:30 AM - 11:30 AM',
          subject: s.subject || s.subjectName || '',
          portion: s.syllabus || s.portion || ''
        }));
        if (match.instructions) {
          instructions = Array.isArray(match.instructions) ? match.instructions.join('\n') : match.instructions;
        }
      }
    } catch (err) {}

    // Display state immediately
    displayScheduleState(rows, instructions);

    // Background fetch from API
    fetchScheduleApiAsync();
  }

  async function fetchScheduleApiAsync() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch(`/api/schedules?academicYear=${encodeURIComponent(currentAcademicYear)}&className=${encodeURIComponent(currentClass)}&examType=${encodeURIComponent(currentExam)}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const schedules = Array.isArray(json) ? json : (json.data || []);
        if (Array.isArray(schedules) && schedules.length > 0) {
          const schedule = schedules[0];
          const rawTable = schedule.timetable || schedule.subjects || [];
          if (rawTable.length > 0) {
            const rows = rawTable.map(s => ({
              date: s.date || '',
              day: s.day || '',
              timing: s.time || s.timing || '09:30 AM - 11:30 AM',
              subject: s.subject || s.subjectName || '',
              portion: s.syllabus || s.portion || ''
            }));
            const instructions = schedule.instructions ? (Array.isArray(schedule.instructions) ? schedule.instructions.join('\n') : schedule.instructions) : null;
            displayScheduleState(rows, instructions);
          }
        }
      }
    } catch (e) {}
  }

  function displayScheduleState(rows, instructions, isPrompt = false) {
    const responsiveContainer = document.querySelector('.timetable-table-responsive');
    const whatsappBtn = document.getElementById('whatsappShareBtn');

    if (isPrompt || !currentClass || !currentExam) {
      if (whatsappBtn) whatsappBtn.style.display = 'none';
      if (timetableTable) timetableTable.style.display = 'none';
      if (examInstructionsBox) examInstructionsBox.style.display = 'none';

      let emptyDiv = document.getElementById('timetableEmptyState');
      if (!emptyDiv) {
        emptyDiv = document.createElement('div');
        emptyDiv.id = 'timetableEmptyState';
        emptyDiv.style.cssText = 'padding: 55px 24px; text-align: center; background: #ffffff;';
        if (responsiveContainer) responsiveContainer.appendChild(emptyDiv);
      }
      emptyDiv.style.display = 'block';
      emptyDiv.innerHTML = `
        <div style="max-width: 520px; margin: 0 auto;">
          <i class="fas fa-hand-pointer" style="font-size: 2.8rem; color: #0a4f8a; margin-bottom: 16px; display: inline-block;"></i>
          <h4 style="font-family: 'Outfit', sans-serif; font-size: 1.35rem; font-weight: 700; color: #0f1c2e; margin-bottom: 8px;">
            Please Select Class and Assessment
          </h4>
          <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6; margin-bottom: 0;">
            Choose your child's Class and Assessment Type from the dropdowns above to view their exam schedule and syllabus portions.
          </p>
        </div>
      `;
      return;
    }

    if (!rows || rows.length === 0) {
      if (whatsappBtn) whatsappBtn.style.display = 'none';
      if (examDateRangeBadge) {
        examDateRangeBadge.textContent = 'Status: Schedule Awaited';
      }

      if (timetableTable) timetableTable.style.display = 'none';
      if (examInstructionsBox) examInstructionsBox.style.display = 'none';

      let emptyDiv = document.getElementById('timetableEmptyState');
      if (!emptyDiv) {
        emptyDiv = document.createElement('div');
        emptyDiv.id = 'timetableEmptyState';
        emptyDiv.style.cssText = 'padding: 55px 24px; text-align: center; background: #ffffff;';
        if (responsiveContainer) responsiveContainer.appendChild(emptyDiv);
      }
      emptyDiv.style.display = 'block';
      emptyDiv.innerHTML = `
        <div style="max-width: 520px; margin: 0 auto;">
          <i class="far fa-calendar-times" style="font-size: 3rem; color: #94a3b8; margin-bottom: 16px; display: inline-block;"></i>
          <h4 style="font-family: 'Fredoka', cursive; font-size: 1.35rem; font-weight: 700; color: #0f2c59; margin-bottom: 10px;">
            Schedule Awaited for ${currentClass} (${currentExam})
          </h4>
          <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px;">
            The official examination timetable will be published here by the school administration once dates are finalized.
          </p>
          <div style="display: inline-flex; align-items: center; gap: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 8px 18px; border-radius: 9999px; font-weight: 700; font-size: 0.85rem;">
            <i class="fas fa-bolt" style="color: #16a34a;"></i> Instant real-time updates active
          </div>
        </div>
      `;
    } else {
      const emptyDiv = document.getElementById('timetableEmptyState');
      if (emptyDiv) emptyDiv.style.display = 'none';

      if (timetableTable) timetableTable.style.display = 'table';
      if (whatsappBtn) {
        whatsappBtn.style.display = 'inline-flex';
        whatsappBtn.onclick = () => shareTimetableOnWhatsApp(rows);
      }
      renderTableRows(rows);

      if (examDateRangeBadge && rows.length > 0) {
        const firstDate = rows[0].date;
        const lastDate = rows[rows.length - 1].date;
        examDateRangeBadge.textContent = firstDate === lastDate ? `Exam Date: ${firstDate}` : `Exam Dates: ${firstDate} - ${lastDate}`;
      }

      if (examInstructionsBox) {
        examInstructionsBox.style.display = 'block';
        if (instructions && instructionsList) {
          instructionsList.innerHTML = instructions.split('\n').filter(Boolean).map(i => `<li>${i}</li>`).join('');
        }
      }
    }
  }

  // WhatsApp Share Formatter (Direct Clean Link)
  function shareTimetableOnWhatsApp() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal ? 'https://www.kinderjoyschool.co.in' : window.location.origin;
    const timetableUrl = `${baseUrl}/notices.html?class=${encodeURIComponent(currentClass)}&exam=${encodeURIComponent(currentExam)}`;

    let msg = `*🏫 KINDER JOY E.M.U.P. SCHOOL - RAYACHOTY*\n`;
    msg += `📋 *${currentClass} - ${currentExam} Examination Timetable*\n\n`;
    msg += `👉 *Tap link to view timetable:*\n`;
    msg += `${timetableUrl}`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  }

  // Subject Icon Map based on academic subjects
  function getSubjectIcon(subj) {
    const s = (subj || '').toLowerCase();
    if (s.includes('telugu')) return '📖';
    if (s.includes('hindi')) return '📚';
    if (s.includes('english')) return '🔤';
    if (s.includes('math')) return '➕';
    if (s.includes('science') || s.includes('evs')) return '🌿';
    if (s.includes('physic')) return '⚛️';
    if (s.includes('social')) return '🌍';
    if (s.includes('computer') || s.includes('it')) return '💻';
    if (s.includes('draw') || s.includes('art')) return '🎨';
    if (s.includes('gk') || s.includes('general')) return '💡';
    return '📝';
  }

  // Soft tint color classes matching the reference card
  const ROW_THEMES = [
    'theme-pink',
    'theme-yellow',
    'theme-blue',
    'theme-green',
    'theme-purple',
    'theme-teal',
    'theme-orange'
  ];

  function renderTableRows(rows) {
    if (!timetableBody) return;
    timetableBody.innerHTML = '';

    rows.forEach((row, idx) => {
      const themeClass = ROW_THEMES[idx % ROW_THEMES.length];
      const icon = getSubjectIcon(row.subject);
      const tr = document.createElement('tr');
      tr.className = `curriculum-row ${themeClass}`;
      tr.innerHTML = `
        <td class="col-subject" data-label="Subject">
          <div class="subject-cell-content">
            <span class="subject-name-text">${row.subject}</span>
            <span class="subject-cell-icon" aria-hidden="true">${icon}</span>
          </div>
        </td>
        <td class="col-datetime" data-label="Date &amp; Time">
          <div class="datetime-cell-content">
            <div class="exam-date-text"><strong>${row.date}</strong>${row.day ? ` <span class="exam-day-text">(${row.day})</span>` : ''}</div>
            <div class="exam-time-pill"><i class="far fa-clock"></i> ${row.timing}</div>
          </div>
        </td>
        <td class="col-syllabus" data-label="Syllabus">
          <div class="syllabus-cell-content">
            ${row.portion || 'As per syllabus prescribed.'}
          </div>
        </td>
      `;
      timetableBody.appendChild(tr);
    });
  }

  // Setup the 2 Dropdowns & Print Button
  function setupFilters() {
    // 1. Class Dropdown
    if (classSelect) {
      classSelect.value = currentClass;
      classSelect.addEventListener('change', (e) => {
        currentClass = e.target.value;
        renderTimetable();
      });
    }

    // 2. Exam Dropdown
    if (examSelect) {
      examSelect.value = currentExam;
      examSelect.addEventListener('change', (e) => {
        currentExam = e.target.value;
        renderTimetable();
      });
    }

    // Print Button
    if (printTimetableBtn) {
      printTimetableBtn.addEventListener('click', () => window.print());
    }
  }

  // Instant Launch Execution (0ms)
  function init() {
    parseQueryParams();
    setupFilters();
    renderTimetable();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
