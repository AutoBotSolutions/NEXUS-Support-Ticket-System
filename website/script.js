// ===== NEXUS SUPPORT SYSTEM JAVASCRIPT =====

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
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

    // Mobile menu toggle
    const mobileMenuToggle = document.createElement('button');
    mobileMenuToggle.className = 'mobile-menu-toggle';
    mobileMenuToggle.innerHTML = '☰';
    mobileMenuToggle.style.display = 'none';
    
    const navContainer = document.querySelector('.nav-container');
    if (navContainer) {
        navContainer.appendChild(mobileMenuToggle);
    }

    // Mobile menu functionality
    const navMenu = document.querySelector('.nav-menu');
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('mobile-active');
            this.innerHTML = navMenu.classList.contains('mobile-active') ? '✕' : '☰';
        });
    }

    // Check mobile screen size
    function checkMobile() {
        if (window.innerWidth <= 768) {
            if (mobileMenuToggle) mobileMenuToggle.style.display = 'block';
            if (navMenu) navMenu.classList.add('mobile-hidden');
        } else {
            if (mobileMenuToggle) mobileMenuToggle.style.display = 'none';
            if (navMenu) {
                navMenu.classList.remove('mobile-hidden');
                navMenu.classList.remove('mobile-active');
            }
        }
    }

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Form validation for contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value.trim();
            
            let errors = [];
            
            if (name.length < 2) {
                errors.push('Name must be at least 2 characters long');
            }
            
            if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                errors.push('Please enter a valid email address');
            }
            
            if (!subject) {
                errors.push('Please select a subject');
            }
            
            if (message.length < 10) {
                errors.push('Message must be at least 10 characters long');
            }
            
            if (errors.length > 0) {
                alert('Please fix the following errors:\n\n' + errors.join('\n'));
                return;
            }
            
            // Show success message
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        });
    }

    // Documentation navigation
    const docsLinks = document.querySelectorAll('.docs-link');
    const docsSections = document.querySelectorAll('.docs-section');
    
    function updateActiveDocLink() {
        const scrollPosition = window.scrollY + 100;
        
        docsLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        docsSections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                const activeLink = document.querySelector(`.docs-link[href="#${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }

    // Update active doc link on scroll
    if (docsLinks.length > 0 && docsSections.length > 0) {
        window.addEventListener('scroll', updateActiveDocLink);
        updateActiveDocLink(); // Initial call
    }

    // Copy code functionality
    const codeBlocks = document.querySelectorAll('.code-block pre');
    codeBlocks.forEach(block => {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '📋 Copy';
        copyButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 255, 255, 0.2);
            color: #00ffff;
            border: 1px solid rgba(0, 255, 255, 0.3);
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const container = block.parentElement;
        if (container) {
            container.style.position = 'relative';
            container.appendChild(copyButton);
            
            container.addEventListener('mouseenter', () => {
                copyButton.style.opacity = '1';
            });
            
            container.addEventListener('mouseleave', () => {
                copyButton.style.opacity = '0';
            });
            
            copyButton.addEventListener('click', () => {
                const text = block.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    copyButton.innerHTML = '✅ Copied!';
                    setTimeout(() => {
                        copyButton.innerHTML = '📋 Copy';
                    }, 2000);
                });
            });
        }
    });

    // FAQ accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('h3');
        const answer = item.querySelector('p');
        
        if (question && answer) {
            question.style.cursor = 'pointer';
            answer.style.display = 'none';
            
            question.addEventListener('click', () => {
                const isVisible = answer.style.display === 'block';
                answer.style.display = isVisible ? 'none' : 'block';
                question.innerHTML += isVisible ? ' ▶' : ' ▼';
            });
            
            // Add arrow indicator
            question.innerHTML += ' ▶';
        }
    });

    // Stats counter animation
    const statNumbers = document.querySelectorAll('.stat-number');
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const finalValue = target.textContent;
                const numericValue = parseInt(finalValue.replace(/[^0-9]/g, ''));
                const suffix = finalValue.replace(/[0-9]/g, '');
                
                let currentValue = 0;
                const increment = numericValue / 50;
                const timer = setInterval(() => {
                    currentValue += increment;
                    if (currentValue >= numericValue) {
                        currentValue = numericValue;
                        clearInterval(timer);
                    }
                    target.textContent = Math.floor(currentValue) + suffix;
                }, 30);
                
                observer.unobserve(target);
            }
        });
    }, observerOptions);
    
    statNumbers.forEach(stat => {
        observer.observe(stat);
    });

    // Hero graphic animation
    const heroGraphic = document.querySelector('.hero-graphic');
    if (heroGraphic) {
        let mouseX = 0;
        let mouseY = 0;
        let currentX = 0;
        let currentY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 20;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 20;
        });
        
        function animateHeroGraphic() {
            currentX += (mouseX - currentX) * 0.1;
            currentY += (mouseY - currentY) * 0.1;
            
            heroGraphic.style.transform = `translate(${currentX}px, ${currentY}px)`;
            requestAnimationFrame(animateHeroGraphic);
        }
        
        animateHeroGraphic();
    }

    // Loading animation
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });

    // Console welcome message
    console.log('%cNEXUS Support System', 'color: #00ffff; font-size: 20px; font-weight: bold; text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);');
    console.log('%cAdvanced Support Ticket Management', 'color: #b8b8d1; font-size: 14px;');
    console.log('%chttps://nexus.com', 'color: #74c0fc; font-size: 12px;');
});

// ===== END NEXUS SUPPORT SYSTEM JAVASCRIPT =====
