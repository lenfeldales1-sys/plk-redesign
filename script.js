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

    // Format Currency Helper
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK',
            maximumFractionDigits: 0
        }).format(value);
    };

    // Helper to determine interest rate based on duration
    const getInterestRate = (duration) => {
        if (duration <= 12) return 18.0;
        if (duration <= 24) return 16.0;
        if (duration <= 36) return 13.0;
        if (duration <= 48) return 12.5;
        // For 60 and anything above (since the pattern decreases)
        return 11.5;
    };

    // Financial Leasing Calculation (Python script port)
    const calculateFinancialLeasing = (priceWithoutVat, downPaymentPct, duration, ratePa) => {
        const dphRate = 0.21;
        const priceWithVat = priceWithoutVat * (1 + dphRate);
        const downPayment = priceWithVat * (downPaymentPct / 100);

        // VAT part of the down payment
        const downPaymentVat = downPayment - (downPayment / (1 + dphRate));

        const monthlyRate = ratePa / 12 / 100;
        const vatRefundMonth = 4; // Fixed as per requirements
        const buyoutPrice = 1000.0;

        // 1. Simulation function
        const simulateBalance = (grossPayment) => {
            // Total VAT refund calculation
            // Note: The Python script calculates this based on the TOTAL contract value
            const totalVatRefund = (downPayment + (duration * grossPayment) + buyoutPrice) * dphRate - (downPaymentVat * (1 + dphRate));

            // Initial principal (Z0)
            const z0 = priceWithoutVat + totalVatRefund + downPaymentVat;

            // Day 0: Down payment and 1st installment
            let balance = z0 - downPayment - grossPayment;

            // Months 2 to duration (Standard payments)
            // The Python script used range(2, 55) presumably for a specific case.
            // We generalize this to loop until the end of the term.
            // The last payment is usually at month 'duration'.
            for (let month = 2; month <= duration; month++) {
                const interest = balance * monthlyRate;
                let currentPayment = grossPayment;

                if (month === vatRefundMonth) {
                    currentPayment += totalVatRefund;
                }

                balance = balance + interest - currentPayment;
            }

            // End of term (Buyout) - usually happens after the last payment period
            // In the Python script this was fixed at month 55. We assume it's duration + 1 or effectively immediate after.
            balance = balance + (balance * monthlyRate) - buyoutPrice;

            return { balance, totalVatRefund };
        };

        // 2. Bisection Method to find optimal payment
        let low = 0.0;
        let high = priceWithVat; // Upper bound guess
        const tolerance = 0.0001;

        // Safety break
        let iterations = 0;
        while ((high - low) > tolerance && iterations < 1000) {
            const mid = (low + high) / 2;
            const result = simulateBalance(mid);

            if (result.balance > 0) {
                low = mid;
            } else {
                high = mid;
            }
            iterations++;
        }

        return (low + high) / 2;
    };

    const calculatePayment = () => {
        const price = parseInt(priceSlider.value);
        const downPaymentPercent = parseInt(downPaymentSlider.value);
        const duration = parseInt(durationSlider.value);

        // Update Displays
        priceDisplay.textContent = formatCurrency(price);
        downPaymentPercentDisplay.textContent = downPaymentPercent;

        // Calculate down payment based on price with VAT as per new logic
        const priceWithVat = price * 1.21;
        const downPaymentValueCalculated = priceWithVat * (downPaymentPercent / 100);

        downPaymentValueDisplay.textContent = formatCurrency(downPaymentValueCalculated);

        durationDisplay.textContent = `${duration} měsíců`;

        // Determine Interest Rate
        const ratePa = getInterestRate(duration);

        // Perform Calculation
        let monthlyPayment = calculateFinancialLeasing(price, downPaymentPercent, duration, ratePa);

        if (!isFinite(monthlyPayment) || isNaN(monthlyPayment)) {
            monthlyPayment = 0;
        }

        monthlyPaymentDisplay.textContent = new Intl.NumberFormat('cs-CZ').format(Math.round(monthlyPayment)).replace(/\s/g, ' ');
    };

    // Event Listeners
    priceSlider.addEventListener('input', calculatePayment);
    downPaymentSlider.addEventListener('input', calculatePayment);
    durationSlider.addEventListener('input', calculatePayment);

    // Initialize
    calculatePayment();
});
