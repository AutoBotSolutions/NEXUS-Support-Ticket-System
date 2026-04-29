// NEXUS Support System - Website JavaScript

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
let lastScroll = 0;
const navContainer = document.querySelector('.nav-container');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navContainer.style.background = 'rgba(5, 5, 16, 0.98)';
        navContainer.style.boxShadow = '0 2px 20px rgba(0, 255, 255, 0.1)';
    } else {
        navContainer.style.background = 'rgba(5, 5, 16, 0.95)';
        navContainer.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// Typing effect for hero title
const titleLines = document.querySelectorAll('.title-line');
titleLines.forEach((line, index) => {
    line.style.opacity = '0';
    setTimeout(() => {
        line.style.transition = 'opacity 0.5s ease';
        line.style.opacity = '1';
    }, index * 300);
});

// Animate stats on scroll
const stats = document.querySelectorAll('.stat-number');
let statsAnimated = false;

function animateStats() {
    if (statsAnimated) return;
    
    stats.forEach(stat => {
        const target = stat.innerText;
        const isPercentage = target.includes('%');
        const isTime = target.includes('ms');
        const isK = target.includes('K');
        
        let numericValue = parseFloat(target.replace(/[^0-9.]/g, ''));
        let current = 0;
        const increment = numericValue / 50;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
                current = numericValue;
                clearInterval(timer);
            }
            
            let displayValue = Math.floor(current);
            if (isK) displayValue = displayValue + 'K+';
            else if (isPercentage) displayValue = displayValue + '%';
            else if (isTime) displayValue = displayValue + 'ms';
            else displayValue = displayValue + '+';
            
            stat.innerText = displayValue;
        }, 30);
    });
    
    statsAnimated = true;
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateStats();
        }
    });
}, observerOptions);

const statsSection = document.querySelector('.stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Animate feature cards on scroll
const featureCards = document.querySelectorAll('.feature-card');
const featureObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 100);
        }
    });
}, observerOptions);

featureCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    featureObserver.observe(card);
});

// Animate doc cards on scroll
const docCards = document.querySelectorAll('.doc-card');
const docObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 100);
        }
    });
}, observerOptions);

docCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    docObserver.observe(card);
});

// Form validation and submission
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = contactForm.querySelector('input[type="text"]').value;
        const email = contactForm.querySelector('input[type="email"]').value;
        const message = contactForm.querySelector('textarea').value;
        
        if (name && email && message) {
            // Show success message
            alert('Message transmitted successfully! We will respond shortly.');
            contactForm.reset();
        } else {
            alert('Please fill in all fields before transmitting.');
        }
    });
}

// Button hover effects
const buttons = document.querySelectorAll('.primary-button, .secondary-button, .cta-button, .submit-button');
buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
    });
    
    button.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');
    
    if (heroContent && scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
        heroContent.style.opacity = 1 - (scrolled / window.innerHeight);
    }
});

// Mobile menu toggle (for future implementation)
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Add particle effect on mouse move
document.addEventListener('mousemove', (e) => {
    const particles = document.querySelector('.particles');
    if (particles) {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        particles.style.backgroundPosition = `${x * 50}px ${y * 50}px`;
    }
});

// Add glow effect to feature cards on hover
featureCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.3)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.boxShadow = 'none';
    });
});

// Smooth reveal animation for sections
const sections = document.querySelectorAll('section');
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

sections.forEach(section => {
    if (section.id !== 'home') {
        section.style.opacity = '0';
        section.style.transform = 'translateY(50px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        sectionObserver.observe(section);
    }
});

// Console easter egg
console.log('%c NEXUS SUPPORT SYSTEM ', 'background: #00ffff; color: #0a0a1a; font-size: 20px; font-weight: bold; padding: 10px;');
console.log('%c System Status: ONLINE ', 'color: #00ff00; font-size: 12px;');
console.log('%c GitHub Integration: ACTIVE ', 'color: #00ffff; font-size: 12px;');
console.log('%c Security Level: MAXIMUM ', 'color: #ff00ff; font-size: 12px;');
