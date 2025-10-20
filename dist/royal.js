/**
 * ═══════════════════════════════════════════════════════════
 * ROYAL CODE JAVASCRIPT LIBRARY v1.0
 * Professional Website Functions & Utilities
 * Developed by Usama Bashir
 * ═══════════════════════════════════════════════════════════
 */

const RoyalCode = (function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // CORE UTILITIES
  // ═══════════════════════════════════════════════════════════

  const Utils = {
    /**
     * Select single element
     */
    select: (selector, parent = document) => {
      return parent.querySelector(selector);
    },

    /**
     * Select multiple elements
     */
    selectAll: (selector, parent = document) => {
      return Array.from(parent.querySelectorAll(selector));
    },

    /**
     * Add event listener with multiple events
     */
    on: (element, events, handler, options = false) => {
      if (typeof events === 'string') events = events.split(' ');
      events.forEach(event => {
        if (typeof element === 'string') {
          Utils.selectAll(element).forEach(el => {
            el.addEventListener(event, handler, options);
          });
        } else {
          element.addEventListener(event, handler, options);
        }
      });
    },

    /**
     * Remove event listener
     */
    off: (element, events, handler) => {
      if (typeof events === 'string') events = events.split(' ');
      events.forEach(event => {
        element.removeEventListener(event, handler);
      });
    },

    /**
     * Debounce function
     */
    debounce: (func, wait = 300) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Throttle function
     */
    throttle: (func, limit = 300) => {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    /**
     * Check if element is in viewport
     */
    isInViewport: (element, offset = 0) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= -offset &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    },

    /**
     * Get element offset from top
     */
    getOffset: (element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.pageYOffset,
        left: rect.left + window.pageXOffset
      };
    },

    /**
     * Generate unique ID
     */
    generateID: (prefix = 'rc') => {
      return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // HAMBURGER MENU
  // ═══════════════════════════════════════════════════════════

  class HamburgerMenu {
    constructor(options = {}) {
      this.hamburger = options.hamburger || Utils.select('[data-rc-hamburger]');
      this.menu = options.menu || Utils.select('[data-rc-menu]');
      this.overlay = options.overlay || Utils.select('[data-rc-overlay]');
      this.closeOnLinkClick = options.closeOnLinkClick !== false;
      this.closeOnOverlay = options.closeOnOverlay !== false;
      this.closeOnEsc = options.closeOnEsc !== false;
      this.bodyScrollLock = options.bodyScrollLock !== false;
      this.activeClass = options.activeClass || 'active';
      this.callbacks = {
        onOpen: options.onOpen || null,
        onClose: options.onClose || null
      };

      if (this.hamburger && this.menu) {
        this.init();
      }
    }

    init() {
      // Toggle on hamburger click
      Utils.on(this.hamburger, 'click', (e) => {
        e.preventDefault();
        this.toggle();
      });

      // Close on overlay click
      if (this.overlay && this.closeOnOverlay) {
        Utils.on(this.overlay, 'click', () => this.close());
      }

      // Close on menu link click
      if (this.closeOnLinkClick) {
        const links = Utils.selectAll('a', this.menu);
        links.forEach(link => {
          Utils.on(link, 'click', () => this.close());
        });
      }

      // Close on ESC key
      if (this.closeOnEsc) {
        Utils.on(document, 'keydown', (e) => {
          if (e.key === 'Escape' && this.isOpen()) {
            this.close();
          }
        });
      }
    }

    toggle() {
      this.isOpen() ? this.close() : this.open();
    }

    open() {
      this.hamburger.classList.add(this.activeClass);
      this.menu.classList.add(this.activeClass);
      if (this.overlay) this.overlay.classList.add(this.activeClass);
      
      if (this.bodyScrollLock) {
        document.body.style.overflow = 'hidden';
      }

      if (this.callbacks.onOpen) this.callbacks.onOpen();
    }

    close() {
      this.hamburger.classList.remove(this.activeClass);
      this.menu.classList.remove(this.activeClass);
      if (this.overlay) this.overlay.classList.remove(this.activeClass);
      
      if (this.bodyScrollLock) {
        document.body.style.overflow = '';
      }

      if (this.callbacks.onClose) this.callbacks.onClose();
    }

    isOpen() {
      return this.menu.classList.contains(this.activeClass);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MODAL MANAGER
  // ═══════════════════════════════════════════════════════════

  class ModalManager {
    constructor(options = {}) {
      this.modals = new Map();
      this.activeModal = null;
      this.queue = [];
      this.closeOnOverlay = options.closeOnOverlay !== false;
      this.closeOnEsc = options.closeOnEsc !== false;
      this.bodyScrollLock = options.bodyScrollLock !== false;
      this.sequential = options.sequential || false;
      
      this.init();
    }

    init() {
      // Auto-detect modals
      const modalElements = Utils.selectAll('[data-rc-modal]');
      modalElements.forEach(modal => {
        const id = modal.dataset.rcModal || Utils.generateID('modal');
        this.register(id, modal);
      });

      // Auto-detect triggers
      const triggers = Utils.selectAll('[data-rc-modal-trigger]');
      triggers.forEach(trigger => {
        const targetId = trigger.dataset.rcModalTrigger;
        Utils.on(trigger, 'click', (e) => {
          e.preventDefault();
          this.open(targetId);
        });
      });

      // Global ESC key listener
      if (this.closeOnEsc) {
        Utils.on(document, 'keydown', (e) => {
          if (e.key === 'Escape' && this.activeModal) {
            this.close();
          }
        });
      }
    }

    register(id, element, options = {}) {
      const overlay = element.querySelector('[data-rc-modal-overlay]');
      const closeBtn = element.querySelector('[data-rc-modal-close]');
      
      this.modals.set(id, {
        element,
        overlay,
        closeBtn,
        options: {
          onOpen: options.onOpen || null,
          onClose: options.onClose || null,
          beforeClose: options.beforeClose || null,
          closeOnOverlay: options.closeOnOverlay !== false ? this.closeOnOverlay : false
        }
      });

      // Setup close button
      if (closeBtn) {
        Utils.on(closeBtn, 'click', () => this.close(id));
      }

      // Setup overlay click
      if (overlay && this.closeOnOverlay) {
        Utils.on(overlay, 'click', (e) => {
          if (e.target === overlay) {
            this.close(id);
          }
        });
      }
    }

    open(id, data = null) {
      if (this.sequential && this.activeModal) {
        this.queue.push({ id, data });
        return;
      }

      const modal = this.modals.get(id);
      if (!modal) return;

      // Close current modal if exists
      if (this.activeModal && this.activeModal !== id) {
        this.close(this.activeModal, true);
      }

      modal.element.classList.add('active');
      modal.element.style.display = 'flex';
      
      if (this.bodyScrollLock) {
        document.body.style.overflow = 'hidden';
      }

      this.activeModal = id;

      // Trigger animation
      setTimeout(() => {
        modal.element.classList.add('show');
      }, 10);

      if (modal.options.onOpen) {
        modal.options.onOpen(data);
      }
    }

    close(id = null, silent = false) {
      const modalId = id || this.activeModal;
      if (!modalId) return;

      const modal = this.modals.get(modalId);
      if (!modal) return;

      // Before close callback
      if (modal.options.beforeClose && !silent) {
        const shouldClose = modal.options.beforeClose();
        if (shouldClose === false) return;
      }

      modal.element.classList.remove('show');

      setTimeout(() => {
        modal.element.classList.remove('active');
        modal.element.style.display = '';
        
        if (this.bodyScrollLock && !this.hasOtherActiveModals()) {
          document.body.style.overflow = '';
        }

        if (modalId === this.activeModal) {
          this.activeModal = null;
        }

        if (!silent && modal.options.onClose) {
          modal.options.onClose();
        }

        // Process queue
        if (this.queue.length > 0) {
          const next = this.queue.shift();
          this.open(next.id, next.data);
        }
      }, 300);
    }

    closeAll() {
      this.modals.forEach((modal, id) => {
        this.close(id, true);
      });
      this.queue = [];
    }

    hasOtherActiveModals() {
      let count = 0;
      this.modals.forEach(modal => {
        if (modal.element.classList.contains('active')) count++;
      });
      return count > 0;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SCROLL ANIMATIONS
  // ═══════════════════════════════════════════════════════════

  class ScrollAnimations {
    constructor(options = {}) {
      this.selector = options.selector || '[class*="rc-"]';
      this.animateClass = options.animateClass || 'rc-animate';
      this.offset = options.offset || 100;
      this.once = options.once !== false;
      this.elements = [];
      
      this.init();
    }

    init() {
      this.elements = Utils.selectAll(this.selector);
      
      const observerOptions = {
        threshold: 0.1,
        rootMargin: `0px 0px -${this.offset}px 0px`
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(this.animateClass);
            if (this.once) {
              this.observer.unobserve(entry.target);
            }
          } else if (!this.once) {
            entry.target.classList.remove(this.animateClass);
          }
        });
      }, observerOptions);

      this.elements.forEach(el => this.observer.observe(el));
    }

    refresh() {
      if (this.observer) {
        this.elements.forEach(el => this.observer.unobserve(el));
      }
      this.init();
    }

    destroy() {
      if (this.observer) {
        this.observer.disconnect();
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SMOOTH SCROLL
  // ═══════════════════════════════════════════════════════════

  class SmoothScroll {
    constructor(options = {}) {
      this.duration = options.duration || 800;
      this.offset = options.offset || 0;
      this.easing = options.easing || 'easeInOutCubic';
      
      this.easings = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
      };
      
      this.init();
    }

    init() {
      const links = Utils.selectAll('a[href^="#"]');
      links.forEach(link => {
        Utils.on(link, 'click', (e) => {
          const href = link.getAttribute('href');
          if (href === '#') return;
          
          const target = Utils.select(href);
          if (target) {
            e.preventDefault();
            this.scrollTo(target);
          }
        });
      });
    }

    scrollTo(target, customOffset = null) {
      const targetPosition = Utils.getOffset(target).top;
      const startPosition = window.pageYOffset;
      const distance = targetPosition - startPosition - (customOffset !== null ? customOffset : this.offset);
      let startTime = null;

      const animation = (currentTime) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / this.duration, 1);
        const ease = this.easings[this.easing](progress);
        
        window.scrollTo(0, startPosition + distance * ease);
        
        if (timeElapsed < this.duration) {
          requestAnimationFrame(animation);
        }
      };

      requestAnimationFrame(animation);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TABS
  // ═══════════════════════════════════════════════════════════

  class Tabs {
    constructor(options = {}) {
      this.container = options.container || Utils.select('[data-rc-tabs]');
      this.activeClass = options.activeClass || 'active';
      this.onChange = options.onChange || null;
      
      if (this.container) {
        this.init();
      }
    }

    init() {
      this.triggers = Utils.selectAll('[data-rc-tab-trigger]', this.container);
      this.panels = Utils.selectAll('[data-rc-tab-panel]', this.container);
      
      this.triggers.forEach((trigger, index) => {
        Utils.on(trigger, 'click', (e) => {
          e.preventDefault();
          this.activate(index);
        });
      });
    }

    activate(index) {
      // Deactivate all
      this.triggers.forEach(t => t.classList.remove(this.activeClass));
      this.panels.forEach(p => {
        p.classList.remove(this.activeClass);
        p.style.display = 'none';
      });

      // Activate selected
      if (this.triggers[index]) {
        this.triggers[index].classList.add(this.activeClass);
      }
      if (this.panels[index]) {
        this.panels[index].classList.add(this.activeClass);
        this.panels[index].style.display = 'block';
      }

      if (this.onChange) {
        this.onChange(index);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ACCORDION
  // ═══════════════════════════════════════════════════════════

  class Accordion {
    constructor(options = {}) {
      this.container = options.container || Utils.select('[data-rc-accordion]');
      this.allowMultiple = options.allowMultiple || false;
      this.activeClass = options.activeClass || 'active';
      this.duration = options.duration || 300;
      
      if (this.container) {
        this.init();
      }
    }

    init() {
      this.items = Utils.selectAll('[data-rc-accordion-item]', this.container);
      
      this.items.forEach(item => {
        const trigger = Utils.select('[data-rc-accordion-trigger]', item);
        const content = Utils.select('[data-rc-accordion-content]', item);
        
        if (trigger && content) {
          Utils.on(trigger, 'click', () => {
            this.toggle(item, content);
          });
          
          // Set initial state
          if (!item.classList.contains(this.activeClass)) {
            content.style.maxHeight = '0px';
            content.style.overflow = 'hidden';
          }
        }
      });
    }

    toggle(item, content) {
      const isActive = item.classList.contains(this.activeClass);
      
      if (!this.allowMultiple) {
        this.closeAll();
      }
      
      if (isActive) {
        this.close(item, content);
      } else {
        this.open(item, content);
      }
    }

    open(item, content) {
      item.classList.add(this.activeClass);
      content.style.maxHeight = content.scrollHeight + 'px';
      
      setTimeout(() => {
        content.style.overflow = 'visible';
      }, this.duration);
    }

    close(item, content) {
      item.classList.remove(this.activeClass);
      content.style.overflow = 'hidden';
      content.style.maxHeight = '0px';
    }

    closeAll() {
      this.items.forEach(item => {
        const content = Utils.select('[data-rc-accordion-content]', item);
        if (content) {
          this.close(item, content);
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STICKY HEADER
  // ═══════════════════════════════════════════════════════════

  class StickyHeader {
    constructor(options = {}) {
      this.header = options.header || Utils.select('[data-rc-header]');
      this.stickyClass = options.stickyClass || 'sticky';
      this.offset = options.offset || 100;
      this.hideOnScrollDown = options.hideOnScrollDown || false;
      this.lastScroll = 0;
      
      if (this.header) {
        this.init();
      }
    }

    init() {
      const handleScroll = Utils.throttle(() => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > this.offset) {
          this.header.classList.add(this.stickyClass);
          
          if (this.hideOnScrollDown) {
            if (currentScroll > this.lastScroll) {
              this.header.style.transform = 'translateY(-100%)';
            } else {
              this.header.style.transform = 'translateY(0)';
            }
          }
        } else {
          this.header.classList.remove(this.stickyClass);
          this.header.style.transform = '';
        }
        
        this.lastScroll = currentScroll;
      }, 100);
      
      Utils.on(window, 'scroll', handleScroll);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // LAZY LOADING
  // ═══════════════════════════════════════════════════════════

  class LazyLoad {
    constructor(options = {}) {
      this.selector = options.selector || '[data-rc-lazy]';
      this.rootMargin = options.rootMargin || '50px';
      this.threshold = options.threshold || 0.01;
      this.onLoad = options.onLoad || null;
      
      this.init();
    }

    init() {
      const images = Utils.selectAll(this.selector);
      
      const observerOptions = {
        rootMargin: this.rootMargin,
        threshold: this.threshold
      };
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);
      
      images.forEach(img => observer.observe(img));
    }

    loadImage(img) {
      const src = img.dataset.rcLazy;
      if (!src) return;
      
      const tempImg = new Image();
      tempImg.onload = () => {
        img.src = src;
        img.classList.add('loaded');
        img.removeAttribute('data-rc-lazy');
        
        if (this.onLoad) this.onLoad(img);
      };
      tempImg.src = src;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // FORM VALIDATOR
  // ═══════════════════════════════════════════════════════════

  class FormValidator {
    constructor(form, options = {}) {
      this.form = typeof form === 'string' ? Utils.select(form) : form;
      this.errorClass = options.errorClass || 'error';
      this.successClass = options.successClass || 'success';
      this.onSubmit = options.onSubmit || null;
      
      if (this.form) {
        this.init();
      }
    }

    init() {
      Utils.on(this.form, 'submit', (e) => {
        e.preventDefault();
        if (this.validate()) {
          if (this.onSubmit) {
            this.onSubmit(this.getFormData());
          }
        }
      });
      
      // Real-time validation
      const inputs = Utils.selectAll('input, textarea, select', this.form);
      inputs.forEach(input => {
        Utils.on(input, 'blur', () => {
          this.validateField(input);
        });
      });
    }

    validate() {
      const inputs = Utils.selectAll('[required], [data-rc-validate]', this.form);
      let isValid = true;
      
      inputs.forEach(input => {
        if (!this.validateField(input)) {
          isValid = false;
        }
      });
      
      return isValid;
    }

    validateField(field) {
      const value = field.value.trim();
      const type = field.type;
      const parent = field.parentElement;
      let isValid = true;
      let message = '';
      
      // Remove previous errors
      this.clearFieldError(field);
      
      // Required check
      if (field.hasAttribute('required') && !value) {
        isValid = false;
        message = 'This field is required';
      }
      
      // Email validation
      else if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          message = 'Please enter a valid email';
        }
      }
      
      // Min length
      else if (field.hasAttribute('minlength')) {
        const minLength = parseInt(field.getAttribute('minlength'));
        if (value.length < minLength) {
          isValid = false;
          message = `Minimum ${minLength} characters required`;
        }
      }
      
      // Max length
      else if (field.hasAttribute('maxlength')) {
        const maxLength = parseInt(field.getAttribute('maxlength'));
        if (value.length > maxLength) {
          isValid = false;
          message = `Maximum ${maxLength} characters allowed`;
        }
      }
      
      // Pattern
      else if (field.hasAttribute('pattern') && value) {
        const pattern = new RegExp(field.getAttribute('pattern'));
        if (!pattern.test(value)) {
          isValid = false;
          message = field.dataset.errorMessage || 'Invalid format';
        }
      }
      
      if (!isValid) {
        parent.classList.add(this.errorClass);
        this.showError(field, message);
      } else {
        parent.classList.add(this.successClass);
      }
      
      return isValid;
    }

    showError(field, message) {
      let errorEl = field.parentElement.querySelector('.error-message');
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'error-message';
        field.parentElement.appendChild(errorEl);
      }
      errorEl.textContent = message;
    }

    clearFieldError(field) {
      const parent = field.parentElement;
      parent.classList.remove(this.errorClass, this.successClass);
      const errorEl = parent.querySelector('.error-message');
      if (errorEl) errorEl.remove();
    }

    getFormData() {
      const formData = new FormData(this.form);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      return data;
    }

    reset() {
      this.form.reset();
      const inputs = Utils.selectAll('input, textarea, select', this.form);
      inputs.forEach(input => this.clearFieldError(input));
    }
  }

  // ═══════════════════════════════════════════════════════════
  // COUNTER ANIMATION
  // ═══════════════════════════════════════════════════════════

  class CounterAnimation {
    constructor(options = {}) {
      this.selector = options.selector || '[data-rc-counter]';
      this.duration = options.duration || 2000;
      this.once = options.once !== false;
      
      this.init();
    }

    init() {
      const counters = Utils.selectAll(this.selector);
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animate(entry.target);
            if (this.once) {
              observer.unobserve(entry.target);
            }
          }
        });
      }, { threshold: 0.5 });
      
      counters.forEach(counter => observer.observe(counter));
    }

    animate(element) {
      const target = parseInt(element.dataset.rcCounter);
      const duration = parseInt(element.dataset.duration) || this.duration;
      const startTime = performance.now();
      const startValue = 0;
      
      const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(startValue + (target - startValue) * this.easeOutQuad(progress));
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = target.toLocaleString();
        }
      };
      
      requestAnimationFrame(updateCounter);
    }

    easeOutQuad(t) {
      return t * (2 - t);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PARALLAX SCROLL
  // ═══════════════════════════════════════════════════════════

  class ParallaxScroll {
    constructor(options = {}) {
      this.selector = options.selector || '[data-rc-parallax]';
      this.speed = options.speed || 0.5;
      
      this.init();
    }

    init() {
      const elements = Utils.selectAll(this.selector);
      
      const handleScroll = Utils.throttle(() => {
        elements.forEach(el => {
          const speed = parseFloat(el.dataset.rcParallax) || this.speed;
          const rect = el.getBoundingClientRect();
          const scrolled = window.pageYOffset;
          const rate = scrolled * speed;
          
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.style.transform = `translate3d(0, ${rate}px, 0)`;
          }
        });
      }, 10);
      
      Utils.on(window, 'scroll', handleScroll);
      handleScroll();
    }
  }

  // ═══════════════════════════════════════════════════════════
  // DROPDOWN
  // ═══════════════════════════════════════════════════════════

  class Dropdown {
    constructor(options = {}) {
      this.selector = options.selector || '[data-rc-dropdown]';
      this.activeClass = options.activeClass || 'active';
      this.closeOnClickOutside = options.closeOnClickOutside !== false;
      
      this.init();
    }

    init() {
      const dropdowns = Utils.selectAll(this.selector);
      
      dropdowns.forEach(dropdown => {
        const trigger = Utils.select('[data-rc-dropdown-trigger]', dropdown);
        const menu = Utils.select('[data-rc-dropdown-menu]', dropdown);
        
        if (trigger && menu) {
          Utils.on(trigger, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle(dropdown, menu);
          });
        }
      });
      
      if (this.closeOnClickOutside) {
        Utils.on(document, 'click', (e) => {
          dropdowns.forEach(dropdown => {
            const menu = Utils.select('[data-rc-dropdown-menu]', dropdown);
            if (menu && !dropdown.contains(e.target)) {
              menu.classList.remove(this.activeClass);
              dropdown.classList.remove(this.activeClass);
            }
          });
        });
      }
    }

    toggle(dropdown, menu) {
      const isActive = menu.classList.contains(this.activeClass);
      
      // Close all dropdowns
      const allMenus = Utils.selectAll('[data-rc-dropdown-menu]');
      allMenus.forEach(m => {
        m.classList.remove(this.activeClass);
        m.closest('[data-rc-dropdown]').classList.remove(this.activeClass);
      });
      
      if (!isActive) {
        menu.classList.add(this.activeClass);
        dropdown.classList.add(this.activeClass);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════

  class Toast {
    constructor(options = {}) {
      this.container = null;
      this.position = options.position || 'top-right';
      this.duration = options.duration || 3000;
      this.maxToasts = options.maxToasts || 5;
      
      this.createContainer();
    }

    createContainer() {
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = `rc-toast-container rc-toast-${this.position}`;
        this.container.style.cssText = `
          position: fixed;
          z-index: 10000;
          pointer-events: none;
        `;
        
        const positions = {
          'top-right': 'top: 20px; right: 20px;',
          'top-left': 'top: 20px; left: 20px;',
          'top-center': 'top: 20px; left: 50%; transform: translateX(-50%);',
          'bottom-right': 'bottom: 20px; right: 20px;',
          'bottom-left': 'bottom: 20px; left: 20px;',
          'bottom-center': 'bottom: 20px; left: 50%; transform: translateX(-50%);'
        };
        
        this.container.style.cssText += positions[this.position] || positions['top-right'];
        document.body.appendChild(this.container);
      }
    }

    show(message, type = 'info', duration = null) {
      const toast = document.createElement('div');
      toast.className = `rc-toast rc-toast-${type}`;
      toast.style.cssText = `
        background: ${this.getColor(type)};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        pointer-events: auto;
        cursor: pointer;
        opacity: 0;
        transform: translateX(${this.position.includes('right') ? '100%' : '-100%'});
        transition: all 0.3s ease;
        max-width: 350px;
        word-wrap: break-word;
      `;
      
      toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 18px;">${this.getIcon(type)}</span>
          <span>${message}</span>
        </div>
      `;
      
      // Remove oldest if max reached
      const toasts = this.container.querySelectorAll('.rc-toast');
      if (toasts.length >= this.maxToasts) {
        this.remove(toasts[0]);
      }
      
      this.container.appendChild(toast);
      
      // Animate in
      setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
      }, 10);
      
      // Auto remove
      const timeoutDuration = duration !== null ? duration : this.duration;
      if (timeoutDuration > 0) {
        setTimeout(() => this.remove(toast), timeoutDuration);
      }
      
      // Click to remove
      Utils.on(toast, 'click', () => this.remove(toast));
      
      return toast;
    }

    remove(toast) {
      toast.style.opacity = '0';
      toast.style.transform = `translateX(${this.position.includes('right') ? '100%' : '-100%'})`;
      setTimeout(() => toast.remove(), 300);
    }

    getColor(type) {
      const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
      };
      return colors[type] || colors.info;
    }

    getIcon(type) {
      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };
      return icons[type] || icons.info;
    }

    success(message, duration) {
      return this.show(message, 'success', duration);
    }

    error(message, duration) {
      return this.show(message, 'error', duration);
    }

    warning(message, duration) {
      return this.show(message, 'warning', duration);
    }

    info(message, duration) {
      return this.show(message, 'info', duration);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CURSOR FOLLOWER
  // ═══════════════════════════════════════════════════════════

  class CursorFollower {
    constructor(options = {}) {
      this.size = options.size || 40;
      this.color = options.color || 'rgba(59, 130, 246, 0.5)';
      this.delay = options.delay || 100;
      this.cursor = null;
      this.position = { x: 0, y: 0 };
      this.target = { x: 0, y: 0 };
      
      this.init();
    }

    init() {
      this.cursor = document.createElement('div');
      this.cursor.className = 'rc-cursor-follower';
      this.cursor.style.cssText = `
        position: fixed;
        width: ${this.size}px;
        height: ${this.size}px;
        background: ${this.color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        transition: width 0.3s, height 0.3s;
      `;
      document.body.appendChild(this.cursor);
      
      Utils.on(document, 'mousemove', (e) => {
        this.target.x = e.clientX;
        this.target.y = e.clientY;
      });
      
      // Hover effects
      const interactiveElements = Utils.selectAll('a, button, [data-rc-cursor-hover]');
      interactiveElements.forEach(el => {
        Utils.on(el, 'mouseenter', () => {
          this.cursor.style.width = `${this.size * 1.5}px`;
          this.cursor.style.height = `${this.size * 1.5}px`;
        });
        Utils.on(el, 'mouseleave', () => {
          this.cursor.style.width = `${this.size}px`;
          this.cursor.style.height = `${this.size}px`;
        });
      });
      
      this.animate();
    }

    animate() {
      this.position.x += (this.target.x - this.position.x) / (this.delay / 10);
      this.position.y += (this.target.y - this.position.y) / (this.delay / 10);
      
      this.cursor.style.left = `${this.position.x}px`;
      this.cursor.style.top = `${this.position.y}px`;
      
      requestAnimationFrame(() => this.animate());
    }

    destroy() {
      if (this.cursor) {
        this.cursor.remove();
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SCROLL TO TOP
  // ═══════════════════════════════════════════════════════════

  class ScrollToTop {
    constructor(options = {}) {
      this.button = null;
      this.showAt = options.showAt || 300;
      this.position = options.position || 'bottom-right';
      this.duration = options.duration || 500;
      
      this.createButton();
      this.init();
    }

    createButton() {
      this.button = document.createElement('button');
      this.button.className = 'rc-scroll-top';
      this.button.innerHTML = '↑';
      this.button.style.cssText = `
        position: fixed;
        ${this.getPositionStyles()}
        width: 50px;
        height: 50px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 24px;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      
      this.button.addEventListener('mouseenter', () => {
        this.button.style.transform = 'scale(1.1)';
      });
      
      this.button.addEventListener('mouseleave', () => {
        this.button.style.transform = 'scale(1)';
      });
      
      document.body.appendChild(this.button);
    }

    getPositionStyles() {
      const positions = {
        'bottom-right': 'bottom: 30px; right: 30px;',
        'bottom-left': 'bottom: 30px; left: 30px;',
        'top-right': 'top: 30px; right: 30px;',
        'top-left': 'top: 30px; left: 30px;'
      };
      return positions[this.position] || positions['bottom-right'];
    }

    init() {
      const handleScroll = Utils.throttle(() => {
        if (window.pageYOffset > this.showAt) {
          this.button.style.opacity = '1';
          this.button.style.visibility = 'visible';
        } else {
          this.button.style.opacity = '0';
          this.button.style.visibility = 'hidden';
        }
      }, 100);
      
      Utils.on(window, 'scroll', handleScroll);
      
      Utils.on(this.button, 'click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PRELOADER
  // ═══════════════════════════════════════════════════════════

  class Preloader {
    constructor(options = {}) {
      this.element = options.element || Utils.select('[data-rc-preloader]');
      this.duration = options.duration || 500;
      this.minDisplayTime = options.minDisplayTime || 1000;
      this.onComplete = options.onComplete || null;
      this.startTime = Date.now();
      
      if (this.element) {
        this.init();
      } else {
        this.createDefault();
      }
    }

    createDefault() {
      this.element = document.createElement('div');
      this.element.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #fff;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      this.element.innerHTML = `
        <div style="
          width: 50px;
          height: 50px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid #3b82f6;
          border-radius: 50%;
          animation: rc-spin 1s linear infinite;
        "></div>
      `;
      
      // Add keyframes
      if (!document.querySelector('#rc-preloader-styles')) {
        const style = document.createElement('style');
        style.id = 'rc-preloader-styles';
        style.textContent = `
          @keyframes rc-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(this.element);
      this.init();
    }

    init() {
      Utils.on(window, 'load', () => {
        this.hide();
      });
    }

    hide() {
      const elapsed = Date.now() - this.startTime;
      const remainingTime = Math.max(0, this.minDisplayTime - elapsed);
      
      setTimeout(() => {
        this.element.style.transition = `opacity ${this.duration}ms ease`;
        this.element.style.opacity = '0';
        
        setTimeout(() => {
          this.element.remove();
          if (this.onComplete) this.onComplete();
        }, this.duration);
      }, remainingTime);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // COPY TO CLIPBOARD
  // ═══════════════════════════════════════════════════════════

  class CopyToClipboard {
    constructor(options = {}) {
      this.selector = options.selector || '[data-rc-copy]';
      this.successMessage = options.successMessage || 'Copied!';
      this.toast = options.toast || null;
      
      this.init();
    }

    init() {
      const triggers = Utils.selectAll(this.selector);
      
      triggers.forEach(trigger => {
        Utils.on(trigger, 'click', async (e) => {
          e.preventDefault();
          const text = trigger.dataset.rcCopy || trigger.textContent;
          await this.copy(text, trigger);
        });
      });
    }

    async copy(text, trigger) {
      try {
        await navigator.clipboard.writeText(text);
        this.showSuccess(trigger);
      } catch (err) {
        // Fallback method
        this.fallbackCopy(text);
        this.showSuccess(trigger);
      }
    }

    fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }

    showSuccess(trigger) {
      if (this.toast) {
        this.toast.success(this.successMessage);
      } else {
        const originalText = trigger.textContent;
        trigger.textContent = this.successMessage;
        setTimeout(() => {
          trigger.textContent = originalText;
        }, 2000);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // READING PROGRESS BAR
  // ═══════════════════════════════════════════════════════════

  class ReadingProgress {
    constructor(options = {}) {
      this.height = options.height || 4;
      this.color = options.color || '#3b82f6';
      this.position = options.position || 'top';
      this.createBar();
      this.init();
    }

    createBar() {
      this.bar = document.createElement('div');
      this.bar.className = 'rc-reading-progress';
      this.bar.style.cssText = `
        position: fixed;
        ${this.position}: 0;
        left: 0;
        width: 0%;
        height: ${this.height}px;
        background: ${this.color};
        z-index: 9999;
        transition: width 0.1s ease;
      `;
      document.body.appendChild(this.bar);
    }

    init() {
      const updateProgress = Utils.throttle(() => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.pageYOffset;
        const progress = (scrolled / documentHeight) * 100;
        
        this.bar.style.width = `${Math.min(progress, 100)}%`;
      }, 50);
      
      Utils.on(window, 'scroll', updateProgress);
      updateProgress();
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TABLE OF CONTENTS GENERATOR
  // ═══════════════════════════════════════════════════════════

  class TableOfContents {
    constructor(options = {}) {
      this.container = options.container || Utils.select('[data-rc-toc]');
      this.contentArea = options.contentArea || document.querySelector('article, main, .content');
      this.headings = options.headings || 'h2, h3, h4';
      this.activeClass = options.activeClass || 'active';
      
      if (this.container && this.contentArea) {
        this.generate();
        this.setupScrollSpy();
      }
    }

    generate() {
      const headings = Utils.selectAll(this.headings, this.contentArea);
      const tocList = document.createElement('ul');
      tocList.className = 'rc-toc-list';
      
      headings.forEach((heading, index) => {
        // Add ID if not present
        if (!heading.id) {
          heading.id = `heading-${index}`;
        }
        
        const li = document.createElement('li');
        li.className = `rc-toc-item rc-toc-${heading.tagName.toLowerCase()}`;
        
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;
        link.className = 'rc-toc-link';
        
        Utils.on(link, 'click', (e) => {
          e.preventDefault();
          heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        
        li.appendChild(link);
        tocList.appendChild(li);
      });
      
      this.container.innerHTML = '';
      this.container.appendChild(tocList);
    }

    setupScrollSpy() {
      const headings = Utils.selectAll(this.headings, this.contentArea);
      const links = Utils.selectAll('.rc-toc-link', this.container);
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            links.forEach(link => {
              link.classList.remove(this.activeClass);
              if (link.getAttribute('href') === `#${id}`) {
                link.classList.add(this.activeClass);
              }
            });
          }
        });
      }, { rootMargin: '-20% 0px -80% 0px' });
      
      headings.forEach(heading => observer.observe(heading));
    }
  }

  // ═══════════════════════════════════════════════════════════
  // IMAGE LIGHTBOX
  // ═══════════════════════════════════════════════════════════

  class Lightbox {
    constructor(options = {}) {
      this.selector = options.selector || '[data-rc-lightbox]';
      this.lightbox = null;
      this.images = [];
      this.currentIndex = 0;
      
      this.init();
    }

    init() {
      const images = Utils.selectAll(this.selector);
      
      images.forEach((img, index) => {
        this.images.push(img.src || img.dataset.rcLightbox);
        
        Utils.on(img, 'click', () => {
          this.open(index);
        });
      });
    }

    createLightbox() {
      this.lightbox = document.createElement('div');
      this.lightbox.className = 'rc-lightbox';
      this.lightbox.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      
      this.lightbox.innerHTML = `
        <button class="rc-lightbox-close" style="
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          color: white;
          font-size: 40px;
          cursor: pointer;
          z-index: 2;
        ">×</button>
        <button class="rc-lightbox-prev" style="
          position: absolute;
          left: 20px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          font-size: 40px;
          cursor: pointer;
          padding: 10px 20px;
          border-radius: 5px;
        ">‹</button>
        <button class="rc-lightbox-next" style="
          position: absolute;
          right: 20px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          font-size: 40px;
          cursor: pointer;
          padding: 10px 20px;
          border-radius: 5px;
        ">›</button>
        <img class="rc-lightbox-image" style="
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
        ">
      `;
      
      document.body.appendChild(this.lightbox);
      
      // Event listeners
      Utils.on(this.lightbox.querySelector('.rc-lightbox-close'), 'click', () => this.close());
      Utils.on(this.lightbox.querySelector('.rc-lightbox-prev'), 'click', () => this.prev());
      Utils.on(this.lightbox.querySelector('.rc-lightbox-next'), 'click', () => this.next());
      Utils.on(this.lightbox, 'click', (e) => {
        if (e.target === this.lightbox) this.close();
      });
      
      Utils.on(document, 'keydown', (e) => {
        if (!this.lightbox.style.display || this.lightbox.style.display === 'none') return;
        
        if (e.key === 'Escape') this.close();
        if (e.key === 'ArrowLeft') this.prev();
        if (e.key === 'ArrowRight') this.next();
      });
    }

    open(index) {
      if (!this.lightbox) this.createLightbox();
      
      this.currentIndex = index;
      const img = this.lightbox.querySelector('.rc-lightbox-image');
      img.src = this.images[this.currentIndex];
      
      this.lightbox.style.display = 'flex';
      setTimeout(() => {
        this.lightbox.style.opacity = '1';
      }, 10);
      
      document.body.style.overflow = 'hidden';
    }

    close() {
      this.lightbox.style.opacity = '0';
      setTimeout(() => {
        this.lightbox.style.display = 'none';
        document.body.style.overflow = '';
      }, 300);
    }

    next() {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
      const img = this.lightbox.querySelector('.rc-lightbox-image');
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = this.images[this.currentIndex];
        img.style.opacity = '1';
      }, 150);
    }

    prev() {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
      const img = this.lightbox.querySelector('.rc-lightbox-image');
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = this.images[this.currentIndex];
        img.style.opacity = '1';
      }, 150);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════

  return {
    // Utilities
    Utils,
    
    // Components
    HamburgerMenu,
    ModalManager,
    ScrollAnimations,
    SmoothScroll,
    Tabs,
    Accordion,
    StickyHeader,
    LazyLoad,
    FormValidator,
    CounterAnimation,
    ParallaxScroll,
    Dropdown,
    Toast,
    CursorFollower,
    ScrollToTop,
    Preloader,
    CopyToClipboard,
    ReadingProgress,
    TableOfContents,
    Lightbox,
    
    // Quick initialization
    init: (options = {}) => {
      const config = {
        hamburger: true,
        modal: true,
        scrollAnimations: true,
        smoothScroll: true,
        stickyHeader: true,
        lazyLoad: true,
        counterAnimation: true,
        parallax: true,
        dropdown: true,
        scrollToTop: true,
        preloader: true,
        copyToClipboard: true,
        readingProgress: false,
        lightbox: true,
        ...options
      };
      
      const instances = {};
      
      if (config.hamburger) instances.hamburger = new HamburgerMenu();
      if (config.modal) instances.modal = new ModalManager();
      if (config.scrollAnimations) instances.scrollAnimations = new ScrollAnimations();
      if (config.smoothScroll) instances.smoothScroll = new SmoothScroll();
      if (config.stickyHeader) instances.stickyHeader = new StickyHeader();
      if (config.lazyLoad) instances.lazyLoad = new LazyLoad();
      if (config.counterAnimation) instances.counterAnimation = new CounterAnimation();
      if (config.parallax) instances.parallax = new ParallaxScroll();
      if (config.dropdown) instances.dropdown = new Dropdown();
      if (config.scrollToTop) instances.scrollToTop = new ScrollToTop();
      if (config.preloader) instances.preloader = new Preloader();
      if (config.copyToClipboard) instances.copyToClipboard = new CopyToClipboard();
      if (config.readingProgress) instances.readingProgress = new ReadingProgress();
      if (config.lightbox) instances.lightbox = new Lightbox();
      
      return instances;
    }
  };
})();

// Auto-initialize on DOM ready if enabled
if (typeof window !== 'undefined') {
  window.RoyalCode = RoyalCode;
  window.RC = RoyalCode; // Short alias
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RoyalCode;
}