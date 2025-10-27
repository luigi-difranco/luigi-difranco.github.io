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
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('reCAPTCHA failed to load. Please check your internet connection or disable ad blockers.'));
        }, 5000); // 5 second timeout

        if (typeof grecaptcha !== 'undefined' && grecaptcha.ready) {
            clearTimeout(timeout);
            grecaptcha.ready(() => resolve());
        } else {
            // Check every 100ms if grecaptcha is loaded
            const checkInterval = setInterval(() => {
                if (typeof grecaptcha !== 'undefined' && grecaptcha.ready) {
                    clearTimeout(timeout);
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
        const token = await grecaptcha.execute('6LdURfgrAAAAAFU-ExQBeSHNelAQb2kSmoRydlA7', { action: 'submit' });

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

        // Create a form and submit it (bypasses CORS/ORB issues)
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://script.google.com/macros/s/AKfycby6yA7MRcNe8-oxUZg9L5q6gMZ_9l53v2WZKwqjy4HHywvfrQdqHyDvto7iDth-f6iN6w/exec';
        form.target = 'hidden_iframe';
        form.style.display = 'none';

        // Add form fields
        Object.keys(formData).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = formData[key];
            form.appendChild(input);
        });

        // Create hidden iframe to catch the response
        let iframe = document.getElementById('hidden_iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.name = 'hidden_iframe';
            iframe.id = 'hidden_iframe';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
        }

        // Submit the form
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        console.log('Form submitted successfully');

        // Show success message (we can't verify the response due to CORS)
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

    } catch (error) {
        console.error('Error:', error);
        alert('There was an error submitting the form. Please try again. Error: ' + error.message);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});