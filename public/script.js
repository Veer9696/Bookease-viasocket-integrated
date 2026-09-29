// Mock Data Seeding
const seedData = () => {
    if (!localStorage.getItem('doctors')) {
        const doctors = [
            { id: 1, name: 'Dr. Sarah Smith', speciality: 'Cardiology', experience: '15 years', rating: 4.9, fee: 100, languages: ['English', 'Spanish'], available: true, image: 'https://i.pravatar.cc/150?img=1' },
            { id: 2, name: 'Dr. James Wilson', speciality: 'Neurology', experience: '12 years', rating: 4.8, fee: 120, languages: ['English'], available: false, image: 'https://i.pravatar.cc/150?img=11' },
            { id: 3, name: 'Dr. Emily Chen', speciality: 'Dermatology', experience: '8 years', rating: 4.7, fee: 80, languages: ['English', 'Mandarin'], available: true, image: 'https://i.pravatar.cc/150?img=5' },
            { id: 4, name: 'Dr. Michael Brown', speciality: 'Orthopedics', experience: '20 years', rating: 4.9, fee: 150, languages: ['English'], available: true, image: 'https://i.pravatar.cc/150?img=8' },
            { id: 5, name: 'Dr. Aisha Khan', speciality: 'Gynecology', experience: '10 years', rating: 4.6, fee: 90, languages: ['English', 'Hindi', 'Urdu'], available: true, image: 'https://i.pravatar.cc/150?img=9' },
            { id: 6, name: 'Dr. Robert Davis', speciality: 'Pediatrics', experience: '14 years', rating: 4.8, fee: 95, languages: ['English'], available: false, image: 'https://i.pravatar.cc/150?img=12' },
        ];
        localStorage.setItem('doctors', JSON.stringify(doctors));
    }
    if (!localStorage.getItem('bookings')) {
        localStorage.setItem('bookings', JSON.stringify([]));
    }
    if (!localStorage.getItem('reports')) {
        localStorage.setItem('reports', JSON.stringify([]));
    }
    if (!localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify([]));
    }
};

// Toast Notification
const showToast = (message, type = 'success') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '✔';
    if (type === 'error') icon = '✖';
    if (type === 'warning') icon = '⚠';

    toast.innerHTML = `<span style="font-size:1.2rem">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Navbar Hamburger
const initNavbar = () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
};

// Common Navbar Template
const renderNavbar = () => {
    const nav = document.createElement('nav');
    nav.className = 'navbar';
    nav.innerHTML = `
    <a href="index.html" class="nav-brand">
      <span style="font-size: 1.8rem; color: var(--primary);">🩺</span> BookEase
    </a>
    <div class="hamburger">☰</div>
    <ul class="nav-links">
      <li><a href="index.html">Home</a></li>
      <li><a href="doctors.html">Find a Doctor</a></li>
      <li><a href="tests.html">Lab Tests</a></li>
      <li><a href="dashboard.html">Dashboard</a></li>
      <li><a href="integrations.html">Integrations</a></li>
      <li><a href="#" class="btn btn-primary" onclick="showToast('Login coming soon!')">Patient Login</a></li>
    </ul>
  `;
    document.body.insertBefore(nav, document.body.firstChild);
    initNavbar();
};

document.addEventListener('DOMContentLoaded', () => {
    seedData();
    renderNavbar();
});
