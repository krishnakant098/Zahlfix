/* --- Custom Cursor Logic (Preserved) --- */
const cursorDot = document.querySelector('[data-cursor-dot]');
const cursorOutline = document.querySelector('[data-cursor-outline]');

let mouseX = 0;
let mouseY = 0;
let outlineX = 0;
let outlineY = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Dot follows immediately
    if (cursorDot) {
        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;
        cursorDot.style.opacity = 1;
    }
    if (cursorOutline) cursorOutline.style.opacity = 1;
});

const animateCursor = () => {
    const speed = 0.15;
    outlineX += (mouseX - outlineX) * speed;
    outlineY += (mouseY - outlineY) * speed;

    if (cursorOutline) {
        cursorOutline.style.left = `${outlineX}px`;
        cursorOutline.style.top = `${outlineY}px`;
    }

    requestAnimationFrame(animateCursor);
};
animateCursor();

// Hover Effects
const interactiveElements = document.querySelectorAll('a, button, input, textarea, .service-card, .close-modal');
interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        if (cursorOutline) cursorOutline.classList.add('cursor-hover');
        if (cursorDot) cursorDot.classList.add('cursor-hover');
    });
    el.addEventListener('mouseleave', () => {
        if (cursorOutline) cursorOutline.classList.remove('cursor-hover');
        if (cursorDot) cursorDot.classList.remove('cursor-hover');
    });
});

/* --- Mobile Menu --- */
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}

/* --- Navbar Scroll Effect --- */
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar?.classList.add('scrolled');
    } else {
        navbar?.classList.remove('scrolled');
    }
});

/* --- Text Splitting Utility --- */
function splitTextToChars(element) {
    if (!element) return [];
    const text = element.innerText;
    element.innerHTML = '';

    // Split into words first to preserve line breaks/wrapping
    const words = text.split(' ');
    const allChars = [];

    words.forEach((word, wordIndex) => {
        // Create a container for the word (keeps letters together)
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap';

        // Add characters to the word
        word.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.innerText = char;
            charSpan.style.display = 'inline-block';
            charSpan.style.willChange = 'transform, opacity, filter';
            wordSpan.appendChild(charSpan);
            allChars.push(charSpan);
        });

        element.appendChild(wordSpan);

        // Add a space after the word (except the last one)
        if (wordIndex < words.length - 1) {
            const spaceSpan = document.createElement('span');
            spaceSpan.innerHTML = '&nbsp;';
            spaceSpan.style.display = 'inline-block';
            element.appendChild(spaceSpan);
        }
    });

    return allChars;
}

/* --- GSAP Animations --- */
document.addEventListener("DOMContentLoaded", (event) => {
    gsap.registerPlugin(ScrollTrigger);

    /* --- Page Transitions --- */
    const transitionOverlay = document.querySelector('.page-transition-overlay');

    // Entrance Animation (Fade Out)
    if (transitionOverlay) {
        gsap.to(transitionOverlay, {
            opacity: 0,
            duration: 0.4,
            ease: "power2.inOut",
            onComplete: () => {
                transitionOverlay.style.pointerEvents = "none";
            }
        });
    }

    // Exit Animation (Fade In) for Links
    const internalLinks = document.querySelectorAll('a[href]:not([target="_blank"]):not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"])');

    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('href');
            // Check if it's an internal navigation
            const isInternal = target.startsWith('/') || target.startsWith('.') || target.includes(window.location.hostname) || !target.includes('http');

            if (isInternal && transitionOverlay) {
                e.preventDefault();
                transitionOverlay.style.pointerEvents = "all"; // Block clicks during transition

                gsap.to(transitionOverlay, {
                    opacity: 1,
                    duration: 0.3,
                    ease: "power2.inOut",
                    onComplete: () => {
                        window.location.href = target;
                    }
                });
            }
        });
    });

    // Handle Back Button (bfcache)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted && transitionOverlay) {
            gsap.set(transitionOverlay, { opacity: 0 });
        }
    });

    /* --- Password Logic --- */
    const passwordOverlay = document.getElementById('password-overlay');
    const passwordForm = document.getElementById('password-form');
    const passwordInput = document.getElementById('site-password');
    const passwordError = document.getElementById('password-error');
    const validPassword = "2026"; // Simple client-side check

    // Check if already authenticated
    const isAuth = sessionStorage.getItem('auth');
    if (isAuth && isAuth === 'true') {
        if (passwordOverlay) {
            passwordOverlay.classList.add('hidden');
            passwordOverlay.style.display = 'none'; // Force hide to prevent flash
        }
        document.body.style.overflow = '';
    } else {
        document.body.style.overflow = 'hidden';
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (passwordInput.value === validPassword) {
                sessionStorage.setItem('auth', 'true');
                passwordOverlay.classList.add('hidden');
                document.body.style.overflow = '';
                passwordError.textContent = '';

                // Allow animations to play if they were waiting
                ScrollTrigger.refresh();
            } else {
                passwordError.textContent = 'Falsches Passwort';
                passwordForm.classList.add('shake');
                setTimeout(() => passwordForm.classList.remove('shake'), 500);
            }
        });
    }

    // --- Lenis Smooth Scroll Setup ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    // Synchronize for optimal performance
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    // Disable lag smoothing to prevent jumpiness on heavy loads
    gsap.ticker.lagSmoothing(0);

    // Anchor Link Smooth Scroll Intercept
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                lenis.scrollTo(targetElement, {
                    offset: 0,
                    duration: 1.5,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                });
            }
        });
    });

    // Prepare elements for animation
    const heroTitle = document.querySelector(".hero-title");
    const heroSubtitle = document.querySelector(".hero-subtitle");

    // Split text into chars
    const titleChars = splitTextToChars(heroTitle);
    const subtitleChars = splitTextToChars(heroSubtitle);

    // Initial Hide/Set for non-split elements
    gsap.set(".hero-text, .hero-buttons", { autoAlpha: 0, y: 30 });
    gsap.set("#hero-bg", { scale: 1.2 });

    /* --- "Shatter Blur-In" Hero Sequence (Replayable) --- */
    const heroTl = gsap.timeline({
        paused: true, // Only play when triggered
        defaults: { ease: "power4.out" }
    });

    // 1. Background Settle
    heroTl.to("#hero-bg", { scale: 1, duration: 2.5, ease: "power2.out" }, 0);

    // 2. Subtitle Shatter-In (Subtle)
    if (subtitleChars.length) {
        heroTl.fromTo(subtitleChars, {
            opacity: 0,
            filter: "blur(10px)",
            x: () => Math.random() * 100 - 50,
            y: () => Math.random() * 50 - 25,
            rotation: () => Math.random() * 90 - 45,
            scale: 2
        }, {
            opacity: 1,
            filter: "blur(0px)",
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            duration: 1.5,
            stagger: { amount: 0.5, from: "center" }
        }, 0.2);
    }

    // 3. Title Shatter-In (Dramatic)
    if (titleChars.length) {
        heroTl.fromTo(titleChars, {
            opacity: 0,
            filter: "blur(20px)",
            x: () => Math.random() * 500 - 250,
            y: () => Math.random() * 500 - 250,
            rotation: () => Math.random() * 360 - 180,
            scale: 0.5
        }, {
            opacity: 1,
            filter: "blur(0px)",
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            duration: 1.8,
            stagger: { amount: 0.8, from: "random" }
        }, 0.3);
    }

    // 4. Rest of content Fade Up
    heroTl.to([".hero-text", ".hero-buttons"], { autoAlpha: 1, y: 0, duration: 1, filter: "blur(0px)", stagger: 0.2 }, 1.5);

    // Trigger Logic for Play/Reverse
    ScrollTrigger.create({
        trigger: "#hero",
        start: "top 60%",
        onEnter: () => heroTl.restart(),     // Play when arriving at top
        onLeave: () => heroTl.reverse(),     // Reverse when scrolling down away
        onEnterBack: () => heroTl.restart(), // Play again coming back up
        onLeaveBack: () => heroTl.reverse()  // Reverse if scrolling up past it
    });


    /* --- Scroll Animations (Preserved) --- */

    // Hero Parallax on Scroll (Smoother)
    gsap.to("#hero-bg", {
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        },
        yPercent: 25, // Optimized depth
        ease: "none"
    });

    // Stats Section
    gsap.utils.toArray(".stat-item").forEach((item, i) => {
        gsap.fromTo(item,
            { autoAlpha: 0, y: 50 },
            {
                scrollTrigger: {
                    trigger: ".stats-section",
                    start: "top 80%",
                },
                autoAlpha: 1,
                y: 0,
                duration: 0.8,
                delay: i * 0.2,
                ease: "back.out(1.7)"
            }
        );
    });

    // Services Section Parallax Background
    const servicesBg = document.querySelector(".services-bg");
    if (servicesBg) {
        gsap.to(servicesBg, {
            scrollTrigger: {
                trigger: ".services-section",
                start: "top bottom",
                end: "bottom top",
                scrub: true
            },
            yPercent: 25, // Optimized depth
            ease: "none"
        });
    }

    // Services Section Content (Split Text & Animate)
    const servicesTitle = document.querySelector(".services-section .section-title");
    const servicesDesc = document.querySelector(".services-section .section-desc");

    // Split title for effect if it exists
    if (servicesTitle) {
        const titleChars = splitTextToChars(servicesTitle);
        const servicesTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".services-section",
                start: "top 60%", // Start earlier
            }
        });

        servicesTl.from(titleChars, {
            duration: 1,
            opacity: 0,
            y: 50,
            rotateX: -90,
            stagger: 0.05,
            ease: "back.out(1.7)"
        })
            .from(servicesDesc, {
                duration: 0.8,
                autoAlpha: 0,
                y: 20,
                ease: "power2.out"
            }, "-=0.5");
    }

    // Services Section Cards (Blurry Cascade)
    const cards = gsap.utils.toArray(".service-card");
    if (cards.length) {
        gsap.fromTo(cards,
            {
                autoAlpha: 0,
                y: 100,
                scale: 0.9,
                filter: "blur(20px)"
            },
            {
                scrollTrigger: {
                    trigger: ".services-grid",
                    start: "top 80%",
                    toggleActions: "play reverse play reverse" // Play in both directions, reverse when leaving
                },
                autoAlpha: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
                duration: 1,
                stagger: 0.1,
                ease: "power4.out"
            }
        );
    }

    // Interactive Hover Tilt Effect for Cards
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate tilt based on mouse position
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg tilt
            const rotateY = ((x - centerX) / centerX) * 10;

            gsap.to(card, {
                duration: 0.5,
                rotateX: rotateX,
                rotateY: rotateY,
                transformPerspective: 1000,
                ease: "power2.out"
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                duration: 0.5,
                rotateX: 0,
                rotateY: 0,
                ease: "power2.out"
            });
        });
    });

    // Feature Parallax Logic
    const featureBg = document.querySelector(".feature-bg");
    if (featureBg) {
        gsap.to(featureBg, {
            scrollTrigger: {
                trigger: ".feature-parallax",
                start: "top bottom",
                end: "bottom top",
                scrub: true
            },
            yPercent: 25, // Optimized depth
            ease: "none"
        });
    }

    // Feature Scale/Blur-In Effect (Replayable)
    gsap.fromTo(".feature-text",
        { autoAlpha: 0, scale: 0.8, filter: "blur(15px)" },
        {
            scrollTrigger: {
                trigger: ".feature-parallax",
                start: "top 70%",
                end: "bottom 30%",
                toggleActions: "play reverse play reverse"
            },
            autoAlpha: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 1.2,
            ease: "power3.out"
        }
    );

    // About Section (Replayable)
    const aboutTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".about-section",
            start: "top 70%",
            end: "bottom 30%",
            toggleActions: "play reverse play reverse"
        }
    });

    aboutTl.fromTo(".about-image",
        { autoAlpha: 0, x: -50, filter: "blur(15px)" },
        { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 1.2, ease: "power3.out" }
    )
        .fromTo(".about-info",
            { autoAlpha: 0, x: 50, filter: "blur(15px)" },
            { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 1.2, ease: "power3.out" },
            "<0.1" // Small overlap
        );

    // Contact Section
    gsap.fromTo(".contact-wrapper",
        { autoAlpha: 0, y: 50 },
        {
            scrollTrigger: {
                trigger: ".contact-section",
                start: "top 75%",
            },
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: "power2.out"
        }
    );
});
