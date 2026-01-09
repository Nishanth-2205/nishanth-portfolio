// ===== SCROLL TO TOP FUNCTIONALITY =====
const scrollToTopBtn = document.getElementById('scrollToTopBtn');

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('visible');
    } else {
        scrollToTopBtn.classList.remove('visible');
    }
    
    // Add navbar shadow on scroll
    const navbar = document.querySelector('.navbar');
    if (window.pageYOffset > 10) {
        navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
    } else {
        navbar.style.boxShadow = 'none';
    }
});

scrollToTopBtn.addEventListener('click', scrollToTop);

// ===== MODAL MANAGEMENT =====
const modalTriggers = document.querySelectorAll('[data-modal]');
const modals = document.querySelectorAll('.modal');
const closeButtons = document.querySelectorAll('.modal-close');
const aboutButton = document.querySelector('.about-button');

// Open modal from card click
modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
        const modalId = trigger.getAttribute('data-modal') + '-modal';
        const modal = document.getElementById(modalId);
        if (modal) {
            openModal(modal);
        }
    });
});

// Open "More About Me" modal from the section button
if (aboutButton) {
    aboutButton.addEventListener('click', () => {
        const modal = document.getElementById('more-about-modal');
        if (modal) {
            openModal(modal);
        }
    });
}

function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
}

// Close modal functionality
closeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
            closeModal(modal);
        }
    });
});

// Close modal when clicking outside the content
modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        modals.forEach(modal => {
            if (modal.classList.contains('active')) {
                closeModal(modal);
            }
        });
    }
});

// ===== NAVBAR INTERACTIONS =====
const navbarName = document.querySelector('.navbar-name');
if (navbarName) {
    navbarName.style.cursor = 'pointer';
}

// ===== NAVBAR 'About' opens a short About modal =====
const navAboutBtn = document.getElementById('navAboutBtn');
if (navAboutBtn) {
    navAboutBtn.addEventListener('click', (e) => {
        const modal = document.getElementById('about-modal');
        if (modal) {
            openModal(modal);
        }
    });
}

// ===== INTERSECTION OBSERVER FOR SCROLL ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe cards for animation
document.querySelectorAll('.card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
    observer.observe(card);
});

// Reveal Life & Interests sections on scroll
if ('IntersectionObserver' in window) {
    const interestObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.interests-reveal').forEach(section => {
        interestObserver.observe(section);
    });
}

// Interest carousels: arrows, dots, swipe, keyboard
document.querySelectorAll('.interest-carousel').forEach((carousel) => {
    const cards = Array.from(carousel.querySelectorAll('.carousel-card'));
    if (!cards.length) {
        return;
    }

    let index = 0;
    const prevBtn = carousel.querySelector('.carousel-control.prev');
    const nextBtn = carousel.querySelector('.carousel-control.next');

    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'carousel-dots';
    dotsWrap.setAttribute('role', 'tablist');
    dotsWrap.setAttribute('aria-label', `${carousel.getAttribute('aria-label')} pagination`);
    carousel.appendChild(dotsWrap);

    const dots = cards.map((card, dotIndex) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Go to image ${dotIndex + 1}`);
        dot.addEventListener('click', () => {
            index = dotIndex;
            updateCarousel();
        });
        dotsWrap.appendChild(dot);
        return dot;
    });

    const updateCarousel = () => {
        cards.forEach((card, cardIndex) => {
            const pos = (cardIndex - index + cards.length) % cards.length;
            card.dataset.pos = pos;
        });
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('is-active', dotIndex === index);
        });
    };

    const goNext = () => {
        index = (index + 1) % cards.length;
        updateCarousel();
    };

    const goPrev = () => {
        index = (index - 1 + cards.length) % cards.length;
        updateCarousel();
    };

    if (nextBtn) {
        nextBtn.addEventListener('click', goNext);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', goPrev);
    }

    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            goNext();
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goPrev();
        }
    });

    let startX = 0;
    let startY = 0;
    let isSwiping = false;

    carousel.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        isSwiping = false;
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
            isSwiping = true;
            e.preventDefault();
        }
    }, { passive: false });

    carousel.addEventListener('touchend', (e) => {
        if (!isSwiping) {
            return;
        }
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - startX;
        if (deltaX < -40) {
            goNext();
        }
        if (deltaX > 40) {
            goPrev();
        }
    });

    updateCarousel();
});

// Reveal Life & Interests background on scroll (mobile-friendly, no hover required)
if (aboutButton && 'IntersectionObserver' in window) {
    const aboutObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                aboutButton.classList.add('is-visible');
            } else {
                aboutButton.classList.remove('is-visible');
            }
        });
    }, { threshold: 0.4 });
    aboutObserver.observe(aboutButton);
}

// ===== 3D CARD HOVER EFFECT =====
document.querySelectorAll('.card').forEach((card, index) => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const rotateX = (y - 0.5) * 8;
        const rotateY = (x - 0.5) * -8;

        // Apply 3D tilt + slight lift while hovering
        card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-18px)`;
    });

    // When the pointer leaves, smoothly return to the resting state (down)
    card.addEventListener('mouseleave', () => {
        // Clear inline transform to allow CSS default (no transform) to take over
        // Setting to a neutral transform ensures a smooth transition back to rest
        card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
});

// ===== RIPPLE EFFECT ON BUTTON CLICK =====
function addRippleEffect(element) {
    return function(e) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.position = 'absolute';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.borderRadius = '50%';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.pointerEvents = 'none';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s ease-out';
        
        element.style.position = 'relative';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    };
}

// Add ripple effect to cards
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', addRippleEffect(card));
});

// Add ripple effect to buttons
document.querySelectorAll('.connect-btn').forEach(btn => {
    btn.addEventListener('click', addRippleEffect(btn));
});

// ===== ADD RIPPLE ANIMATION TO CSS =====
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(50px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// ===== PARALLAX EFFECT FOR ORBS =====
window.addEventListener('mousemove', (e) => {
    const orbs = document.querySelectorAll('.gradient-orb');
    orbs.forEach(orb => {
        const x = (window.innerWidth - e.clientX * 2) * 0.02;
        const y = (window.innerHeight - e.clientY * 2) * 0.02;
        orb.style.transform = `translate(${x}px, ${y}px)`;
    });
});

// ===== STAGGER ANIMATION FOR MODAL ITEMS =====
function staggerItems(modal) {
    const items = modal.querySelectorAll('.education-item, .cert-item, .cert-hex, .project-item, .publication-item, .volunteer-item, .work-card, .work-section, .volunteer-card, .volunteer-stat');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.animation = `fadeInUp 0.6s ease-out ${index * 0.08}s forwards`;
    });
}


// Call stagger on modal open
modals.forEach(modal => {
    const observer = new MutationObserver(() => {
        if (modal.classList.contains('active')) {
            requestAnimationFrame(() => staggerItems(modal));
        }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
});

// ===== PAGE LOAD ANIMATION =====
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
    document.documentElement.style.opacity = '1';
});

// ===== SMOOTH SCROLL BEHAVIOR FOR ALL ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
});

// ===== PERFORMANCE OPTIMIZATION =====
if ('IntersectionObserver' in window) {
    // Lazy load images if added in future
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ===== TRACK ACTIVE SECTION =====
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.navbar-link');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && href.startsWith('#') && href.slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// ===== CONSOLE MESSAGE =====
console.log('%cWelcome to Nishanth\'s Portfolio', 'font-size: 24px; font-weight: bold; color: #1a1a1a;');
console.log('%cLet\'s create something amazing together! 🚀', 'font-size: 16px; color: #666666;');
