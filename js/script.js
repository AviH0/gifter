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

        shareBtn.textContent = lang === 'en' ? 'Share' : 'שיתוף';
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

        document.getElementById('modal-title').textContent = lang === 'en' ? 'Share' : 'שיתוף';
        document.getElementById('copy-link').textContent = lang === 'en' ? 'Copy Link' : 'העתק קישור';
        document.getElementById('native-share').textContent = lang === 'en' ? 'Share External' : 'שיתוף חיצוני';
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

    // Page QR button
    const pageQrBtn = document.getElementById('page-qr-btn');
    const pageQrModal = document.getElementById('page-qr-modal');
    const closePageQr = document.getElementsByClassName('close-page-qr')[0];
    const downloadQr = document.getElementById('download-qr');
    pageQrBtn.onclick = () => {
        const pageUrl = window.location.href;
        const canvas = document.getElementById('page-qr-display');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Generate QR as image first
        const tempDiv = document.createElement('div');
        new QRCode(tempDiv, {
            text: pageUrl,
            width: 512,
            height: 512,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        const qrImg = tempDiv.querySelector('img');
        qrImg.onload = () => {
            ctx.drawImage(qrImg, 0, 0);
            // Add logo
            const logo = new Image();
            logo.onload = () => {
                const logoSize = 128;
                const x = (512 - logoSize) / 2;
                const y = (512 - logoSize) / 2;
                // Draw white background for logo
                ctx.fillStyle = 'white';
                ctx.fillRect(x, y, logoSize, logoSize);
                // Enable smoothing for logo
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(logo, x, y, logoSize, logoSize);
            };
            logo.src = 'assets/logos/gift-logo.jpeg';
        };
        pageQrModal.style.display = 'block';
        // Position under the button, centered horizontally
        const rect = pageQrBtn.getBoundingClientRect();
        const modalWidth = pageQrModal.offsetWidth;
        pageQrModal.style.left = (rect.left + rect.width / 2 - modalWidth / 2) + 'px';
        pageQrModal.style.top = (rect.bottom + 10) + 'px';
    };
    closePageQr.onclick = () => {
        pageQrModal.style.display = 'none';
    };
    downloadQr.onclick = () => {
        const canvas = document.getElementById('page-qr-display');
        const link = document.createElement('a');
        link.download = 'page-qr.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
    window.onclick = (event) => {
        if (event.target === pageQrModal) {
            pageQrModal.style.display = 'none';
        }
    };
});