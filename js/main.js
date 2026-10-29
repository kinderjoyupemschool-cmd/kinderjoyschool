// Kinder Joy E.M.U.P. School Interactive Logic
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        if (navMenu.classList.contains('active')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      });
    });
  }

  // Active Link on Scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      const targetLink = document.querySelector(`.nav-menu a[href*='${sectionId}']`);
      
      if (targetLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          targetLink.classList.add('active');
        } else {
          targetLink.classList.remove('active');
        }
      }
    });
  });

  // Admission Enquiry Form Submission to WhatsApp
  const admissionForm = document.getElementById('admissionForm');
  if (admissionForm) {
    admissionForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const studentName = document.getElementById('studentName').value.trim();
      const parentName = document.getElementById('parentName').value.trim();
      const grade = document.getElementById('gradeSelect').value;
      const phone = document.getElementById('parentPhone').value.trim();
      const message = document.getElementById('parentMessage').value.trim();

      const whatsappText = `*Admission Enquiry - Kinder Joy E.M.U.P. School*%0A` +
        `------------------------------------%0A` +
        `*Student Name:* ${encodeURIComponent(studentName)}%0A` +
        `*Parent Name:* ${encodeURIComponent(parentName)}%0A` +
        `*Seeking Class:* ${encodeURIComponent(grade)}%0A` +
        `*Contact Phone:* ${encodeURIComponent(phone)}%0A` +
        (message ? `*Notes/Query:* ${encodeURIComponent(message)}%0A` : '') +
        `------------------------------------%0A` +
        `_Submitted via School Website_`;

      const targetNumber = '919133554870';
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${targetNumber}&text=${whatsappText}`;

      // Show brief notification
      const submitBtn = admissionForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Redirecting to WhatsApp...';
      submitBtn.style.backgroundColor = '#25d366';

      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        submitBtn.innerHTML = originalText;
        submitBtn.style.backgroundColor = '';
        admissionForm.reset();
      }, 700);
    });
  }

  // Gallery Filter Tabs Logic
  const galleryBtns = document.querySelectorAll('.gallery-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (galleryBtns.length && galleryItems.length) {
    galleryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        galleryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        galleryItems.forEach(item => {
          if (filter === 'all' || item.getAttribute('data-category') === filter) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        });
      });
    });
  }

  // Scroll to Top Button Logic
  const scrollTopBtn = document.getElementById('scrollToTopBtn');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});
