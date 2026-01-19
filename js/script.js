// Determine language from path
const lang = window.location.pathname.includes('/en/') ? 'en' : 'he';
document.documentElement.lang = lang;
if (lang === 'he') {
    document.documentElement.dir = 'rtl';
}

// Load config and populate page
document.addEventListener('DOMContentLoaded', () => {
    // Set names
    document.getElementById('names').textContent = config.names[lang];

    // Set image
    document.getElementById('wedding-img').src = config.image;

    // Populate gifts
    const giftsContainer = document.getElementById('gifts');
    config.gifts.forEach(gift => {
        const giftDiv = document.createElement('div');
        giftDiv.className = 'gift';

        const img = document.createElement('img');
        img.src = gift.logo;
        img.alt = gift.name[lang];

        const name = document.createElement('h3');
        name.textContent = gift.name[lang];

        const link = document.createElement('a');
        link.href = gift.url;
        link.target = '_blank';
        link.textContent = 'Go to ' + gift.name[lang];

        const shareButtons = document.createElement('div');
        shareButtons.className = 'share-buttons';

        // Facebook share
        const fbShare = document.createElement('a');
        fbShare.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gift.url)}`;
        fbShare.target = '_blank';
        fbShare.textContent = 'FB';

        // Twitter share
        const twShare = document.createElement('a');
        twShare.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out our wedding gift option: ' + gift.name[lang])}&url=${encodeURIComponent(gift.url)}`;
        twShare.target = '_blank';
        twShare.textContent = 'TW';

        shareButtons.appendChild(fbShare);
        shareButtons.appendChild(twShare);

        // QR Code button
        const qrBtn = document.createElement('button');
        qrBtn.textContent = 'QR Code';

        const qrDiv = document.createElement('div');
        qrDiv.className = 'qr-container';

        qrBtn.onclick = () => {
            qrDiv.innerHTML = ''; // Clear previous
            new QRCode(qrDiv, gift.url);
            qrDiv.style.display = qrDiv.style.display === 'block' ? 'none' : 'block';
        };

        giftDiv.appendChild(img);
        giftDiv.appendChild(name);
        giftDiv.appendChild(link);
        giftDiv.appendChild(shareButtons);
        giftDiv.appendChild(qrBtn);
        giftDiv.appendChild(qrDiv);

        giftsContainer.appendChild(giftDiv);
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(savedTheme);
    themeToggle.textContent = savedTheme === 'light' ? 'Dark Mode' : 'Light Mode';
    themeToggle.onclick = () => {
        const currentTheme = document.body.classList.contains('light') ? 'light' : 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.body.classList.remove(currentTheme);
        document.body.classList.add(newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'light' ? 'Dark Mode' : 'Light Mode';
    };

    // Language toggle
    const langToggle = document.getElementById('lang-toggle');
    langToggle.textContent = lang === 'en' ? 'עברית' : 'English';
    langToggle.onclick = () => {
        const newLang = lang === 'en' ? 'he' : 'en';
        window.location.href = newLang === 'he' ? '/' : '/en/';
    };
});