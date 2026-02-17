document.addEventListener('DOMContentLoaded', () => {
    // --- Navbar Scroll Effect ---
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
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

    const residualSlider = document.getElementById('residual-slider');
    const residualDisplay = document.getElementById('residual-display');

    const monthlyPaymentDisplay = document.getElementById('monthly-payment');

    const btnLeasing = document.getElementById('btn-leasing');
    const btnCredit = document.getElementById('btn-credit');

    let isLeasing = true; // Default mode

    // Constants (Orientational Interest Rates)
    const INTEREST_RATE_LEASING = 0.075; // 7.5% p.a.
    const INTEREST_RATE_CREDIT = 0.065; // 6.5% p.a.

    // Format Currency Helper
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK',
            maximumFractionDigits: 0
        }).format(value);
    };

    // Calculate Monthly Payment
    const calculatePayment = () => {
        const price = parseInt(priceSlider.value);
        const downPaymentPercent = parseInt(downPaymentSlider.value);
        const duration = parseInt(durationSlider.value);
        const residualPercent = parseInt(residualSlider.value);

        // Update Displays
        priceDisplay.textContent = formatCurrency(price);
        downPaymentPercentDisplay.textContent = downPaymentPercent;

        const downPaymentValue = price * (downPaymentPercent / 100);
        downPaymentValueDisplay.textContent = formatCurrency(downPaymentValue);

        durationDisplay.textContent = `${duration} měsíců`;
        residualDisplay.textContent = `${residualPercent}%`;

        // Calculation
        const financedAmount = price - downPaymentValue;
        const rate = isLeasing ? INTEREST_RATE_LEASING : INTEREST_RATE_CREDIT;
        const monthlyRate = rate / 12;

        let monthlyPayment = 0;

        if (isLeasing) {
            // Leasing Formula with Residual Value
            // RV is calculated from the original price, usually paid at the end
            const residualValue = price * (residualPercent / 100);

            // Standard PMT formula adjusted for Future Value (FV = -ResidualValue)
            // PMT = (PV - RV / (1+r)^n) * (r / (1 - (1+r)^-n)) is approximation
            // Using precise TVM formula:
            // PMT = (PV * r * (1+r)^n - FV * r) / ((1+r)^n - 1)
            // Where PV = Financed Amount, FV = Residual Value

            // Wait, usually in leasing:
            // Financed Amount is (Price - Down Payment).
            // Residual Value is paid at the end.
            // So we pay off (Price - Down Payment - PresentValue(ResidualValue)) plus interest.

            const pvOfResidual = residualValue / Math.pow(1 + monthlyRate, duration);
            const amountToAmortize = financedAmount - pvOfResidual;

            if (monthlyRate === 0) {
                monthlyPayment = amountToAmortize / duration;
            } else {
                 monthlyPayment = amountToAmortize * (monthlyRate * Math.pow(1 + monthlyRate, duration)) / (Math.pow(1 + monthlyRate, duration) - 1);

                 // Add interest on the residual value part that is held?
                 // Actually, the standard PMT formula covers the interest on the whole principal if we treat RV as a balloon payment.
                 // Let's stick to the standard balloon payment formula:
                 // Payment = (P * (1+r)^n - FV) * (r / ((1+r)^n - 1))
                 // Here P = Financed Amount. FV = Residual Value.
                 // Correct formula for loan with balloon:
                 // M = [ P * r * (1+r)^n - B * r ] / [ (1+r)^n - 1 ]
                 // Where P = Principal (Financed Amount), B = Balloon (Residual Value)

                 monthlyPayment = (financedAmount * monthlyRate * Math.pow(1 + monthlyRate, duration) - residualValue * monthlyRate) / (Math.pow(1 + monthlyRate, duration) - 1);
            }

        } else {
            // Credit (Loan) Formula - usually RV is 0 or handled differently.
            // We will force RV to 0 for credit visually or just ignore it in calc if we want standard loan.
            // If user sets RV in credit mode, it's a "balloon loan". We can support it.

            const balloonValue = price * (residualPercent / 100); // If we allow balloon in credit

            monthlyPayment = (financedAmount * monthlyRate * Math.pow(1 + monthlyRate, duration) - balloonValue * monthlyRate) / (Math.pow(1 + monthlyRate, duration) - 1);
        }

        // Handle NaN or Infinity
        if (!isFinite(monthlyPayment) || isNaN(monthlyPayment)) {
            monthlyPayment = 0;
        }

        monthlyPaymentDisplay.textContent = new Intl.NumberFormat('cs-CZ').format(Math.round(monthlyPayment));
    };

    // Toggle Mode
    const setMode = (mode) => {
        isLeasing = mode === 'leasing';
        if (isLeasing) {
            btnLeasing.classList.add('bg-neon-blue', 'text-black');
            btnLeasing.classList.remove('text-gray-400');
            btnCredit.classList.remove('bg-neon-blue', 'text-black');
            btnCredit.classList.add('text-gray-400');
            // Enable residual slider for leasing usually
             residualSlider.parentElement.style.opacity = '1';
             residualSlider.disabled = false;
        } else {
            btnCredit.classList.add('bg-neon-blue', 'text-black');
            btnCredit.classList.remove('text-gray-400');
            btnLeasing.classList.remove('bg-neon-blue', 'text-black');
            btnLeasing.classList.add('text-gray-400');
            // Disable residual slider for credit if desired, or keep it for balloon loan.
            // Let's keep it but maybe set to 0 by default? No, let user choose.
            // Just for UI clarity, let's keep it enabled as "Poslední navýšená splátka" is common in car loans too.
        }
        calculatePayment();
    };

    // Event Listeners
    btnLeasing.addEventListener('click', () => setMode('leasing'));
    btnCredit.addEventListener('click', () => setMode('credit'));

    priceSlider.addEventListener('input', calculatePayment);
    downPaymentSlider.addEventListener('input', calculatePayment);
    durationSlider.addEventListener('input', calculatePayment);
    residualSlider.addEventListener('input', calculatePayment);

    // Initialize
    calculatePayment();
});
