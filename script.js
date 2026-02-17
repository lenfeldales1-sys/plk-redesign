document.addEventListener('DOMContentLoaded', () => {
    // --- Navbar Scroll Effect ---
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('nav-scrolled');
        } else {
            navbar.classList.remove('nav-scrolled');
        }
    });

    // --- Calculator Logic ---
    const priceSlider = document.getElementById('price-slider');
    const priceDisplay = document.getElementById('price-display');

    const downPaymentSlider = document.getElementById('downpayment-slider');
    const downPaymentPercentDisplay = document.getElementById('downpayment-percent-display');
    const downPaymentValueDisplay = document.getElementById('downpayment-value-display');

    const durationSlider = document.getElementById('duration-slider');
    const durationDisplay = document.getElementById('duration-display');

    const monthlyPaymentDisplay = document.getElementById('monthly-payment');

    const btnLeasing = document.getElementById('btn-leasing');
    const btnCredit = document.getElementById('btn-credit');

    let isLeasing = true; // Default mode

    // Constants (Orientational Interest Rates - slightly higher for 2024 reality)
    const INTEREST_RATE_LEASING = 0.089; // 8.9% p.a.
    const INTEREST_RATE_CREDIT = 0.079; // 7.9% p.a.

    // Format Currency Helper
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK',
            maximumFractionDigits: 0
        }).format(value);
    };

    const calculatePayment = () => {
        const price = parseInt(priceSlider.value);
        const downPaymentPercent = parseInt(downPaymentSlider.value);
        const duration = parseInt(durationSlider.value);

        // Default residual value to 0 for simplicity in this version
        // unless we want to assume a standard balloon for leasing (e.g. 1000 CZK or 0)
        const residualValue = 0;

        // Update Displays
        priceDisplay.textContent = formatCurrency(price);
        downPaymentPercentDisplay.textContent = downPaymentPercent;

        const downPaymentValue = price * (downPaymentPercent / 100);
        downPaymentValueDisplay.textContent = formatCurrency(downPaymentValue);

        durationDisplay.textContent = `${duration} měsíců`;

        // Calculation
        const financedAmount = price - downPaymentValue;
        const rate = isLeasing ? INTEREST_RATE_LEASING : INTEREST_RATE_CREDIT;
        const monthlyRate = rate / 12;

        let monthlyPayment = 0;

        if (monthlyRate === 0) {
            monthlyPayment = (financedAmount - residualValue) / duration;
        } else {
            // Standard loan formula (PMT)
            // PMT = (P * r * (1+r)^n) / ((1+r)^n - 1)
            // With Residual Value (Balloon):
            // PMT = (P - (RV / (1+r)^n)) * (r * (1+r)^n) / ((1+r)^n - 1)
            // Simplified for RV=0:
            monthlyPayment = (financedAmount * monthlyRate * Math.pow(1 + monthlyRate, duration)) / (Math.pow(1 + monthlyRate, duration) - 1);
        }

        if (!isFinite(monthlyPayment) || isNaN(monthlyPayment)) {
            monthlyPayment = 0;
        }

        monthlyPaymentDisplay.textContent = new Intl.NumberFormat('cs-CZ').format(Math.round(monthlyPayment)).replace(/\s/g, ' ');
    };

    const updateToggleUI = () => {
        const activeClasses = ['bg-white', 'text-black', 'shadow-md'];
        const inactiveClasses = ['text-slate-400', 'hover:text-white'];

        if (isLeasing) {
            btnLeasing.classList.add(...activeClasses);
            btnLeasing.classList.remove(...inactiveClasses);

            btnCredit.classList.remove(...activeClasses);
            btnCredit.classList.add(...inactiveClasses);
        } else {
            btnCredit.classList.add(...activeClasses);
            btnCredit.classList.remove(...inactiveClasses);

            btnLeasing.classList.remove(...activeClasses);
            btnLeasing.classList.add(...inactiveClasses);
        }
    };

    // Event Listeners
    btnLeasing.addEventListener('click', () => {
        isLeasing = true;
        updateToggleUI();
        calculatePayment();
    });

    btnCredit.addEventListener('click', () => {
        isLeasing = false;
        updateToggleUI();
        calculatePayment();
    });

    priceSlider.addEventListener('input', calculatePayment);
    downPaymentSlider.addEventListener('input', calculatePayment);
    durationSlider.addEventListener('input', calculatePayment);

    // Initialize
    calculatePayment();
    updateToggleUI();
});
