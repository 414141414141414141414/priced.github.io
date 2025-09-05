document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // CRITICAL: PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
    // This is the object you get from your Firebase project settings.
    // =================================================================================
    const firebaseConfig = {
        apiKey: "AIzaSyBGTn2SzwpLfmX3EpmT-bhaVkk0NxT-0HQ",
        authDomain: "proxy-cb7a2.firebaseapp.com",
        projectId: "proxy-cb7a2",
        storageBucket: "proxy-cb7a2.firebasestorage.app",
        messagingSenderId: "431679802060",
        appId: "1:431679802060:web:192f51fec95c9214449069",
        measurementId: "G-T6BPGQRPQ5"
    };
    // =================================================================================

    // --- 1. INITIALIZATION ---
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- 2. ELEMENT SELECTORS ---
    const siteTitle = document.querySelector('.site-title');
    const showLoginBtn = document.getElementById('show-login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const adminLink = document.getElementById('admin-link');
    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const contentContainer = document.querySelector('.content-container');
    const adminDashboard = document.getElementById('admin-dashboard');
    const audio = document.getElementById('background-audio');
    const muteBtn = document.getElementById('mute-btn');
    const mp3UploadInput = document.getElementById('mp3-upload-input');
    const fileNameDisplay = document.getElementById('file-name');
    const contentForm = document.getElementById('content-form');
    const saveNotification = document.getElementById('save-notification');
    const navLinks = document.querySelectorAll('.admin-nav-link');
    const adminPages = document.querySelectorAll('.admin-page');
    const panels = document.querySelectorAll('.tilting-panel');
    const canvas = document.getElementById('spark-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const maxTilt = 20;

    // --- 3. CORE LOGIC (AUTHENTICATION & DATABASE) ---
    const contentRef = db.collection('content').doc('mainPanels');

    auth.onAuthStateChanged(user => {
        if (user) {
            showLoginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            adminLink.style.display = 'block';
        } else {
            showLoginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            adminLink.style.display = 'none';
            showAdminView(false);
        }
    });

    async function loadContent() {
        try {
            const doc = await contentRef.get();
            if (doc.exists) {
                updatePublicPanels(doc.data());
            } else {
                // If no content in DB, create it from defaults
                const defaultContent = {
                    p1_title: 'Vision', p1_text: 'Gaze through the ethereal plane.',
                    p2_title: 'Power', p2_text: 'Harness the infernal energy.',
                    p3_title: 'Destiny', p3_text: 'Shape your fate among the embers.'
                };
                await contentRef.set(defaultContent);
                updatePublicPanels(defaultContent);
            }
        } catch (error) { console.error("Error loading content:", error); }
    }

    function updatePublicPanels(data) {
        document.querySelector('#panel-1 h2').textContent = data.p1_title;
        document.querySelector('#panel-1 p').textContent = data.p1_text;
        document.querySelector('#panel-2 h2').textContent = data.p2_title;
        document.querySelector('#panel-2 p').textContent = data.p2_text;
        document.querySelector('#panel-3 h2').textContent = data.p3_title;
        document.querySelector('#panel-3 p').textContent = data.p3_text;
    }

    // --- 4. UI AND EVENT LISTENERS ---
    function showAdminView(isAdmin) {
        if (isAdmin) {
            adminDashboard.style.display = 'flex';
            contentContainer.style.display = 'none';
            siteTitle.style.display = 'none';
        } else {
            adminDashboard.style.display = 'none';
            contentContainer.style.display = 'grid';
            siteTitle.style.display = 'block';
        }
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                loginOverlay.classList.remove('visible');
                showAdminView(true);
            })
            .catch(error => {
                errorMessage.textContent = "Error: Invalid credentials.";
                setTimeout(() => errorMessage.textContent = '', 3000);
            });
    });

    logoutBtn.addEventListener('click', () => auth.signOut());
    showLoginBtn.addEventListener('click', () => loginOverlay.classList.add('visible'));
    adminLink.addEventListener('click', () => showAdminView(true));
    loginOverlay.addEventListener('click', (e) => { if (e.target === loginOverlay) loginOverlay.classList.remove('visible'); });

    contentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newData = {
            p1_title: document.getElementById('panel1-title').value, p1_text: document.getElementById('panel1-text').value,
            p2_title: document.getElementById('panel2-title').value, p2_text: document.getElementById('panel2-text').value,
            p3_title: document.getElementById('panel3-title').value, p3_text: document.getElementById('panel3-text').value,
        };
        try {
            await contentRef.set(newData);
            updatePublicPanels(newData);
            saveNotification.style.opacity = '1';
            setTimeout(() => { saveNotification.style.opacity = '0'; }, 2000);
        } catch (error) {
            console.error("Error saving content:", error);
            alert("Could not save changes. Check console for details.");
        }
    });

    document.querySelector('a[href="#content"]').addEventListener('click', async () => {
        const doc = await contentRef.get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('panel1-title').value = data.p1_title; document.getElementById('panel1-text').value = data.p1_text;
            document.getElementById('panel2-title').value = data.p2_title; document.getElementById('panel2-text').value = data.p2_text;
            document.getElementById('panel3-title').value = data.p3_title; document.getElementById('panel3-text').value = data.p3_text;
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = 'page-' + e.target.getAttribute('href').substring(1);
            navLinks.forEach(l => l.classList.remove('active'));
            adminPages.forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- 5. VISUALS & AUDIO (ANIMATIONS) ---
    audio.volume = 0.5;
    document.body.addEventListener('click', () => { audio.play().catch(error => { }); }, { once: true });
    muteBtn.addEventListener('click', () => { audio.muted = !audio.muted; muteBtn.textContent = audio.muted ? 'Unmute' : 'Mute'; });
    mp3UploadInput.addEventListener('change', function (event) { const file = event.target.files[0]; if (file && file.type === 'audio/mpeg') { const newAudioURL = URL.createObjectURL(file); audio.src = newAudioURL; audio.muted = false; muteBtn.textContent = 'Mute'; audio.play(); fileNameDisplay.textContent = `Now Playing: ${file.name}`; } else { fileNameDisplay.textContent = 'Invalid file. Please select an .mp3 file.'; } });

    panels.forEach(panel => {
        panel.addEventListener('mousemove', (event) => {
            const rect = panel.getBoundingClientRect(); const x = event.clientX - rect.left - rect.width / 2; const y = event.clientY - rect.top - rect.height / 2; const tiltY = (x / (rect.width / 2)) * maxTilt; const tiltX = (y / (rect.height / 2)) * -1 * maxTilt; panel.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        });
        panel.addEventListener('mouseleave', () => { panel.style.transform = 'rotateX(0deg) rotateY(0deg)'; });
    });

    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    function createParticle() { const x = Math.random() * canvas.width; const y = canvas.height + Math.random() * 100; const radius = Math.random() * 2.5 + 1; const speedY = Math.random() * -2 - 0.5; const speedX = Math.random() * 2 - 1; const life = Math.random() * 250 + 150; particles.push({ x, y, radius, speedY, speedX, life, maxLife: life }); }
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < 7; i++) { createParticle(); }
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.y += p.speedY; p.x += p.speedX; p.life--; ctx.beginPath(); ctx.globalAlpha = (p.life / p.maxLife) * 0.8; ctx.fillStyle = `hsl(${Math.random() * 25}, 100%, 50%)`; ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); if (p.life <= 0) { particles.splice(i, 1); } }
        ctx.globalAlpha = 1.0;
        requestAnimationFrame(animateParticles);
    }

    // --- 6. INITIAL PAGE LOAD ---
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    loadContent();
    animateParticles();
});