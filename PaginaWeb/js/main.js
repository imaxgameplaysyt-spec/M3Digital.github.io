/* ========================================================================
   M3 DIGITAL — Main JavaScript
   All interactive logic for the landing page
   ======================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initMobileMenu();
  initScrollReveal();
  initActiveNav();
  initHeaderShrink();
  initFAQ();
  initContactForm();
  initBackToTop();
  initCookieBanner();
});


/* ========================================================================
   LOADING SCREEN
   ======================================================================== */
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      // Remove from DOM after transition
      loader.addEventListener('transitionend', () => {
        loader.remove();
      }, { once: true });
    }, 600);
  });

  // Fallback: hide loader after 3 seconds max
  setTimeout(() => {
    if (!loader.classList.contains('hidden')) {
      loader.classList.add('hidden');
    }
  }, 3000);
}


/* ========================================================================
   MOBILE HAMBURGER MENU
   ======================================================================== */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const navlinks = document.getElementById('navlinks');
  if (!hamburger || !navlinks) return;

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    navlinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on link click
  navlinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navlinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (navlinks.classList.contains('open') &&
        !navlinks.contains(e.target) &&
        !hamburger.contains(e.target)) {
      hamburger.classList.remove('open');
      navlinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navlinks.classList.contains('open')) {
      hamburger.classList.remove('open');
      navlinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      hamburger.focus();
    }
  });
}


/* ========================================================================
   SCROLL REVEAL (IntersectionObserver)
   ======================================================================== */
function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if (!revealEls.length) return;

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealEls.forEach(el => el.classList.add('in'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealEls.forEach(el => observer.observe(el));
}


/* ========================================================================
   ACTIVE NAVIGATION HIGHLIGHTING
   ======================================================================== */
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navlinks a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '-80px 0px -40% 0px'
  });

  sections.forEach(section => observer.observe(section));
}


/* ========================================================================
   HEADER SHRINK ON SCROLL
   ======================================================================== */
function initHeaderShrink() {
  const header = document.querySelector('header');
  if (!header) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}


/* ========================================================================
   FAQ ACCORDION
   ======================================================================== */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!question || !answer) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all others
      faqItems.forEach(other => {
        if (other !== item && other.classList.contains('open')) {
          other.classList.remove('open');
          const otherAnswer = other.querySelector('.faq-answer');
          if (otherAnswer) otherAnswer.style.maxHeight = '0';
          const otherBtn = other.querySelector('.faq-question');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current
      item.classList.toggle('open', !isOpen);
      question.setAttribute('aria-expanded', !isOpen);

      if (!isOpen) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        answer.style.maxHeight = '0';
      }
    });
  });
}


/* ========================================================================
   CONTACT FORM — Validation & Submission
   ======================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('.btn-submit');
  const fields = form.querySelectorAll('input[required], textarea[required], select[required]');

  // Real-time validation on blur
  fields.forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      // Clear error when user starts typing
      const errorEl = field.closest('.form-group').querySelector('.form-error');
      if (errorEl && errorEl.classList.contains('visible')) {
        errorEl.classList.remove('visible');
        errorEl.textContent = '';
      }
    });
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields
    let isValid = true;
    fields.forEach(field => {
      if (!validateField(field)) isValid = false;
    });

    if (!isValid) return;

    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const formData = new FormData(form);
      const formAction = form.getAttribute('action');

      // Try FormSubmit.co / Formspree submission via fetch
      if (formAction && formAction.startsWith('https://')) {
        const response = await fetch(formAction, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error('Error en el envío');
      } else {
        // No endpoint configured — use mailto fallback
        const data = Object.fromEntries(formData);
        const subject = encodeURIComponent('Nuevo contacto desde M3 Digital');
        const body = encodeURIComponent(
          `Nombre: ${data.nombre}\nEmail: ${data.email}\nServicio: ${data.servicio}\n\nMensaje:\n${data.mensaje}`
        );
        window.location.href = `mailto:m3.digital.pages@gmail.com?subject=${subject}&body=${body}`;
      }

      // Show success
      submitBtn.classList.remove('loading');
      submitBtn.classList.add('success');
      form.reset();

      // Reset after 3 seconds
      setTimeout(() => {
        submitBtn.classList.remove('success');
        submitBtn.disabled = false;
      }, 3000);

    } catch (error) {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;

      // Fallback: open mailto if fetch failed (e.g. CORS from file://)
      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        const subject = encodeURIComponent('Nuevo contacto desde M3 Digital');
        const body = encodeURIComponent(
          `Nombre: ${data.nombre}\nEmail: ${data.email}\nServicio: ${data.servicio}\n\nMensaje:\n${data.mensaje}`
        );
        window.location.href = `mailto:m3.digital.pages@gmail.com?subject=${subject}&body=${body}`;
      } catch (_) {
        // Show inline error if even mailto fails
        const errorMsg = form.querySelector('.form-submit-error');
        if (errorMsg) {
          errorMsg.textContent = 'Error al enviar. Escríbeme directamente a m3.digital.pages@gmail.com';
          errorMsg.classList.add('visible');
          setTimeout(() => errorMsg.classList.remove('visible'), 5000);
        }
      }
    }
  });
}

function validateField(field) {
  const group = field.closest('.form-group');
  const errorEl = group ? group.querySelector('.form-error') : null;
  let message = '';

  if (field.validity.valueMissing) {
    message = 'Este campo es obligatorio';
  } else if (field.validity.typeMismatch && field.type === 'email') {
    message = 'Introduce un email válido';
  } else if (field.validity.tooShort) {
    message = `Mínimo ${field.minLength} caracteres`;
  }

  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.toggle('visible', message !== '');
  }

  return message === '';
}


/* ========================================================================
   BACK TO TOP BUTTON
   ======================================================================== */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        btn.classList.toggle('visible', window.scrollY > 500);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* ========================================================================
   COOKIE BANNER
   ======================================================================== */
function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;

  // Check if already accepted
  if (localStorage.getItem('m3_cookies_accepted')) return;

  // Show after a short delay
  setTimeout(() => {
    banner.classList.add('visible');
  }, 1500);

  const acceptBtn = document.getElementById('cookie-accept');
  const rejectBtn = document.getElementById('cookie-reject');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem('m3_cookies_accepted', 'true');
      banner.classList.remove('visible');
    });
  }

  if (rejectBtn) {
    rejectBtn.addEventListener('click', () => {
      localStorage.setItem('m3_cookies_accepted', 'rejected');
      banner.classList.remove('visible');
    });
  }
}
