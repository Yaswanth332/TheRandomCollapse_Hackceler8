document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://127.0.0.1:5000';
    // Form containers
    const emailFormContainer = document.getElementById('email-form-container');
    const otpFormContainer = document.getElementById('otp-form-container');
    const loggedInContainer = document.getElementById('logged-in-container');

    // Forms
    const emailForm = document.getElementById('email-form');
    const otpForm = document.getElementById('otp-form');
    
    // Inputs and buttons
    const emailInput = document.getElementById('email');
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const btnText = document.getElementById('btn-text');
    const loadingSpinner = document.getElementById('loading-spinner');
    const otpInputs = document.querySelectorAll('.otp-input');
    const backToEmailBtn = document.getElementById('back-to-email');
    const logoutBtn = document.getElementById('logout-btn');

    // Display elements
    const emailMessage = document.getElementById('email-message');
    const otpMessage = document.getElementById('otp-message');
    const otpEmailDisplay = document.getElementById('otp-email-display');
    const profileInfo = document.getElementById('profile-info');

    // --- State Management ---
    let userEmail = '';

    // Check for existing token on page load
    const token = localStorage.getItem('authToken');
    if (token) {
        showLoggedInView();
        fetchProfile();
    } else {
        showEmailView();
    }

    // --- View Controllers ---
    function showEmailView() {
        emailFormContainer.classList.remove('hidden');
        otpFormContainer.classList.add('hidden');
        loggedInContainer.classList.add('hidden');
    }

    function showOtpView() {
        emailFormContainer.classList.add('hidden');
        otpFormContainer.classList.remove('hidden');
        loggedInContainer.classList.add('hidden');
        otpEmailDisplay.textContent = userEmail;
        otpInputs[0].focus();
    }
    
    function showLoggedInView() {
        emailFormContainer.classList.add('hidden');
        otpFormContainer.classList.add('hidden');
        loggedInContainer.classList.remove('hidden');
    }

    // --- UI Helpers ---
    function showLoading(isLoading) {
        if (isLoading) {
            btnText.classList.add('hidden');
            loadingSpinner.classList.remove('hidden');
            sendOtpBtn.disabled = true;
        } else {
            btnText.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');
            sendOtpBtn.disabled = false;
        }
    }

    function showMessage(element, message, isError = false) {
        element.textContent = message;
        element.className = `mt-4 text-sm text-center ${isError ? 'text-red-500' : 'text-green-600'}`;
    }

    // --- API Calls ---
    async function handleEmailSubmit(e) {
        e.preventDefault();
        userEmail = emailInput.value;
        showLoading(true);
        showMessage(emailMessage, '');

        try {
            const response = await fetch(`${API_BASE_URL}/api/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail }),
            });
            const data = await response.json();
            if (response.ok) {
                showMessage(emailMessage, data.message);
                setTimeout(showOtpView, 1000);
            } else {
                showMessage(emailMessage, data.error || 'An unknown error occurred.', true);
            }
        } catch (error) {
            showMessage(emailMessage, 'Could not connect to the server.', true);
        } finally {
            showLoading(false);
        }
    }

    async function handleOtpSubmit(e) {
        e.preventDefault();
        let otpString = Array.from(otpInputs).map(input => input.value).join('');
        showMessage(otpMessage, '');

        try {
            const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, otp: otpString }),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                showMessage(otpMessage, data.message);
                setTimeout(() => {
                    showLoggedInView();
                    fetchProfile();
                }, 1000);
            } else {
                showMessage(otpMessage, data.error || 'Verification failed.', true);
            }
        } catch (error) {
            showMessage(otpMessage, 'Could not connect to the server.', true);
        }
    }
    
    async function fetchProfile() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            const data = await response.json();
            if (response.ok) {
                profileInfo.innerHTML = `
                    <p><strong>Email:</strong> ${data.user.email}</p>
                    <p><strong>User ID:</strong> ${data.user.id}</p>
                `;
            } else {
                // Token is invalid or expired, log out
                handleLogout();
            }
        } catch (error) {
            profileInfo.textContent = 'Could not fetch profile data.';
        }
    }
    
    function handleLogout() {
        localStorage.removeItem('authToken');
        userEmail = '';
        emailInput.value = '';
        showMessage(emailMessage, 'You have been logged out.');
        showEmailView();
    }

    // --- Event Listeners ---
    emailForm.addEventListener('submit', handleEmailSubmit);
    otpForm.addEventListener('submit', handleOtpSubmit);
    backToEmailBtn.addEventListener('click', showEmailView);
    logoutBtn.addEventListener('click', handleLogout);

    // Auto-focus logic for OTP inputs
    otpInputs.forEach((input, index) => {
        input.addEventListener('keyup', (e) => {
            if (e.key >= 0 && e.key <= 9) {
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            } else if (e.key === 'Backspace') {
                if (index > 0) {
                    otpInputs[index - 1].focus();
                }
            }
        });
    });
});

