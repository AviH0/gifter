// Determine language from path
const lang = window.location.pathname.includes('/en/') ? 'en' : 'he';
document.documentElement.lang = lang;
if (lang === 'he') {
    document.documentElement.dir = 'rtl';
}

// Load config and populate page
document.addEventListener('DOMContentLoaded', () => {
    // Update base href if repoName differs from default
    if (config.repoName && config.repoName !== 'gifter') {
        document.querySelector('base').href = `/${config.repoName}/`;
    }

    // Set background
    const updateBackground = () => {
        const isDark = document.body.classList.contains('dark');
        const bgImage = isDark ? config.backgroundDark : config.backgroundLight;
        if (bgImage) {
            document.body.style.backgroundImage = `url(${bgImage})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
        }
    };

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(savedTheme);

    // Set fonts
    if (config.fonts) {
        document.documentElement.style.setProperty('--font-primary', config.fonts.primary);
        document.documentElement.style.setProperty('--font-secondary', config.fonts.secondary);
    }

    updateBackground();

    // Set title
    document.getElementById('title').textContent = config.title[lang];

    // Set message
    document.getElementById('message').textContent = config.message[lang];

    // Set image
    document.getElementById('wedding-img').src = config.image;

    // Populate gifts
    const giftsContainer = document.getElementById('gifts');
    config.gifts.forEach(gift => {
        // Select random URL if array
        gift.selectedUrl = Array.isArray(gift.url) ? gift.url[Math.floor(Math.random() * gift.url.length)] : gift.url;

        const giftDiv = document.createElement('div');
        giftDiv.className = 'gift';

        const img = document.createElement('img');
        img.src = gift.logo;
        img.alt = gift.name[lang];
        img.style.cursor = 'pointer';
        img.onclick = () => {
            window.open(gift.selectedUrl, '_blank');
        };

        const name = document.createElement('h3');
        name.textContent = gift.name[lang];

        const shareBtn = document.createElement('button');
        shareBtn.textContent = lang === 'en' ? 'Share' : 'שתף';
        shareBtn.onclick = (event) => {
            event.stopPropagation();
            openShareModal(gift, shareBtn);
        };

        giftDiv.appendChild(img);
        giftDiv.appendChild(name);
        giftDiv.appendChild(shareBtn);

        giftsContainer.appendChild(giftDiv);
    });

    // Modal handling
    const modal = document.getElementById('share-modal');
    const closeBtn = document.getElementsByClassName('close')[0];
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        document.getElementById('qr-display').style.display = 'none'; // Hide QR when closing
    };
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.getElementById('qr-display').style.display = 'none';
        }
    };

    function openShareModal(gift, button) {
        const shareUrl = gift.selectedUrl;

        // Position modal above button
        const rect = button.getBoundingClientRect();
        modal.style.left = rect.left + 'px';
        modal.style.top = (rect.top - 250) + 'px'; // Above

        document.getElementById('modal-title').textContent = lang === 'en' ? 'Share' : 'שתף';
        document.getElementById('copy-link').textContent = lang === 'en' ? 'Copy Link' : 'העתק קישור';
        document.getElementById('native-share').textContent = lang === 'en' ? 'Share' : 'שתף';
        document.getElementById('show-qr').textContent = lang === 'en' ? 'Show QR' : 'הצג QR';

        // Copy link
        document.getElementById('copy-link').onclick = () => {
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert(lang === 'en' ? 'Link copied!' : 'הקישור הועתק!');
            });
        };

        // Native share
        document.getElementById('native-share').onclick = () => {
            if (navigator.share) {
                navigator.share({
                    title: lang === 'en' ? 'Wedding Gift' : 'מתנת חתונה',
                    text: lang === 'en' ? 'Check out this wedding gift option' : 'בדוק את אפשרות מתנת החתונה הזו',
                    url: shareUrl
                });
            } else {
                alert(lang === 'en' ? 'Sharing not supported on this device.' : 'שיתוף לא נתמך במכשיר זה.');
            }
        };

        // Show QR
        document.getElementById('show-qr').onclick = () => {
            const qrDisplay = document.getElementById('qr-display');
            if (qrDisplay.style.display === 'block') {
                qrDisplay.style.display = 'none';
            } else {
                qrDisplay.innerHTML = '';
                new QRCode(qrDisplay, {
                    text: shareUrl,
                    width: 128,
                    height: 128,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                qrDisplay.style.display = 'block';
            }
        };

        modal.style.display = 'block';
    }

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.textContent = savedTheme === 'light' ? 'Dark Mode' : 'Light Mode';
    themeToggle.onclick = () => {
        const currentTheme = document.body.classList.contains('light') ? 'light' : 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.body.classList.remove(currentTheme);
        document.body.classList.add(newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'light' ? 'Dark Mode' : 'Light Mode';
        updateBackground();
    };

    // Language toggle
    const langToggle = document.getElementById('lang-toggle');
    langToggle.textContent = lang === 'en' ? 'עברית' : 'English';
    langToggle.onclick = () => {
        const newLang = lang === 'en' ? 'he' : 'en';
        window.location.href = newLang === 'he' ? 'index.html' : 'en/index.html';
    };
});