const aboutBtn = document.getElementById('aboutBtn');
const flipToFront = document.getElementById('flipToFront');
const contactBtn = document.getElementById('contactBtn');
const cardInner = document.getElementById('cardInner');
const cardBack = document.querySelector('.card-back');
const contactDrawer = document.getElementById('contactDrawer');
const contactForm = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');

// Animated text cycling
const roles = ['An Educator', 'A Student', 'A Renaissance Man'];
let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
const animatedRole = document.getElementById('animatedRole');
const typingSpeed = 100;
const deletingSpeed = 50;
const pauseTime = 2000;

function typeEffect() {
    const currentRole = roles[roleIndex];

    if (isDeleting) {
        animatedRole.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
    } else {
        animatedRole.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
    }

    let speed = isDeleting ? deletingSpeed : typingSpeed;

    if (!isDeleting && charIndex === currentRole.length) {
        speed = pauseTime;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
    }

    setTimeout(typeEffect, speed);
}

// Start the typing effect
setTimeout(typeEffect, 1000);

// Card flip functionality
aboutBtn.addEventListener('click', () => {
    cardInner.classList.add('flipped');
    contactDrawer.classList.remove('active');
    cardBack.scrollTop = 0;
});

flipToFront.addEventListener('click', () => {
    cardInner.classList.remove('flipped');
});

// Contact button functionality
contactBtn.addEventListener('click', () => {
    const isOpening = !contactDrawer.classList.contains('active');

    if (isOpening) {
        contactForm.style.display = 'block';
        contactDrawer.classList.add('active');
    } else {
        contactForm.style.display = 'none';
        successMessage.classList.remove('show');
        contactDrawer.classList.remove('active');

        setTimeout(() => {
            contactForm.reset();
            contactForm.style.display = 'block';
        }, 400);
    }
});

// Helper function to wait for reCAPTCHA to load
function waitForRecaptcha() {
    return new Promise((resolve) => {
        if (typeof grecaptcha !== 'undefined' && grecaptcha.ready) {
            grecaptcha.ready(() => resolve());
        } else {
            // Check every 100ms if grecaptcha is loaded
            const checkInterval = setInterval(() => {
                if (typeof grecaptcha !== 'undefined' && grecaptcha.ready) {
                    clearInterval(checkInterval);
                    grecaptcha.ready(() => resolve());
                }
            }, 100);
        }
    });
}

// Form submission with proper error handling
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    const submitBtn = contactForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Verifying...';
    submitBtn.disabled = true;

    try {
        // Wait for reCAPTCHA to be ready
        await waitForRecaptcha();
        
        // Get reCAPTCHA token
        const token = await grecaptcha.execute('6Lf6KPgrAAAAAN20TqyRtK0mFDo81ZnlP5P9MPu8', { action: 'submit' });
        
        console.log('reCAPTCHA token obtained');
        submitBtn.textContent = 'Sending...';

        const formData = {
            timestamp: new Date().toISOString(),
            firstName: firstName,
            lastName: lastName,
            email: email,
            message: message,
            recaptchaToken: token
        };

        console.log('Sending data to Google Apps Script...');

        // Send to Google Apps Script
        const response = await fetch('https://script.google.com/macros/s/AKfycbwR4Dnw4rloj1KoAhGIwzXCp0y6p88JU_CG2ZX5iJvpoE37z9yCth5JeSUPLJbsndmlRg/exec', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        console.log('Response from server:', result);

        if (result.status === 'success') {
            // Show success message
            contactForm.style.display = 'none';
            successMessage.textContent = `Thank you, ${firstName}! You will be contacted shortly!`;
            successMessage.classList.add('show');

            // Close drawer after 3 seconds
            setTimeout(() => {
                successMessage.classList.remove('show');
                contactForm.style.display = 'none';
                contactDrawer.classList.remove('active');

                setTimeout(() => {
                    contactForm.reset();
                    contactForm.style.display = 'block';
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 400);
            }, 3000);
        } else {
            throw new Error(result.message || 'Submission failed');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('There was an error submitting the form. Please try again. Error: ' + error.message);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});