document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('bookingForm');
    const successMessage = document.getElementById('successMessage');

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(bookingForm);
            const bookingData = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/booking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                });

                if (!response.ok) {
                    throw new Error('Server returned an error');
                }

                bookingForm.reset();
                successMessage.textContent = "Booking confirmed!";
                successMessage.style.backgroundColor = "#d4edda";
                successMessage.style.color = "#155724";
                successMessage.style.display = 'block';
                
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 5000);
            } catch (error) {
                console.error("Booking error:", error);
                successMessage.textContent = "Sorry, there was an issue processing your booking. Please try again later.";
                successMessage.style.backgroundColor = "#f8d7da";
                successMessage.style.color = "#721c24";
                successMessage.style.display = 'block';
            }
        });
    }
});
