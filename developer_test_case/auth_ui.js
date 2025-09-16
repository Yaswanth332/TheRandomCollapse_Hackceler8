document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://127.0.0.1:5001'; // Corrected port to 5001
    const API_KEY = '5064eff8232f46528b5c5494140d6fe1af01e3e5437415ef2970'; // Hardcoded API Key

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
            const response = await fetch(`${API_BASE_URL}/api/v1/request-otp`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY 
                },
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
            const response = await fetch(`${API_BASE_URL}/api/v1/verify-otp`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY
                },
                body: JSON.stringify({ email: userEmail, otp: otpString }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                // In a real app, you would get a session token here.
                // For now, we'll just simulate a login.
                localStorage.setItem('authToken', 'fake-jwt-token-for-demo'); // Using a placeholder
                showMessage(otpMessage, data.message);
                setTimeout(() => {
                    showLoggedInView();
                    profileInfo.innerHTML = `<p><strong>Email:</strong> ${userEmail}</p>`;
                }, 1000);
            } else {
                showMessage(otpMessage, data.message || 'Verification failed.', true);
            }
        } catch (error) {
            showMessage(otpMessage, 'Could not connect to the server.', true);
        }
    }
    
    // This function is kept for demonstration but will not work without a /api/profile endpoint
    async function fetchProfile() {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        // Since there is no profile endpoint in chatapp.py, we'll just show the email
        const storedEmail = localStorage.getItem('userEmail');
        if(storedEmail) {
             profileInfo.innerHTML = `<p><strong>Email:</strong> ${storedEmail}</p>`;
        }
    }
    
    function handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        userEmail = '';
        emailInput.value = '';
        otpInputs.forEach(input => input.value = '');
        showMessage(emailMessage, 'You have been logged out.');
        showEmailView();
    }

    // --- Event Listeners ---
    emailForm.addEventListener('submit', handleEmailSubmit);
    otpForm.addEventListener('submit', handleOtpSubmit);
    backToEmailBtn.addEventListener('click', () => {
        otpInputs.forEach(input => input.value = '');
        showMessage(otpMessage, '');
        showEmailView();
    });
    logoutBtn.addEventListener('click', handleLogout);

    // Auto-focus logic for OTP inputs
    otpInputs.forEach((input, index) => {
        input.addEventListener('keyup', (e) => {
            // Move to next input on number entry
            if (e.key >= 0 && e.key <= 9) {
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            } else if (e.key === 'Backspace') {
                // Move to previous input on backspace
                if (index > 0) {
                    otpInputs[index - 1].focus();
                }
            }
        });
    });
});
