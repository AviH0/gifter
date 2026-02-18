// Determine language from path
const lang = window.location.pathname.includes('/en/') ? 'en' : 'he';
document.documentElement.lang = lang;
if (lang === 'he') {
    document.documentElement.dir = 'rtl';
}

// Progress tracking
let progress = 0;
function updateProgress(value, text) {
    progress = value;
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const loadingText = document.getElementById('loading-text');
    
    if (progressFill) progressFill.style.width = value + '%';
    if (progressText) progressText.textContent = Math.round(value) + '%';
    if (text && loadingText) {
        loadingText.textContent = lang === 'en' ? text : text;
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }
}

function showDemo() {
    hideLoading();
    document.getElementById('demo-page').style.display = 'block';
    
    // Setup demo page language toggle
    const demoLangBtn = document.getElementById('demo-lang-toggle');
    if (demoLangBtn) {
        demoLangBtn.textContent = lang === 'en' ? 'עברית' : 'English';
        demoLangBtn.onclick = () => {
            const newLang = lang === 'en' ? '' : 'en/';
            window.location.href = window.location.origin + window.location.pathname.replace(/^\/[^\/]*\//, '/' + newLang);
        };
    }
    
    // Translate demo page if English
    if (lang === 'en') {
        document.querySelector('.demo-title').textContent = '🎁 Event Gift System';
        document.querySelector('.demo-subtitle').textContent = 'Create an encrypted and secure gift page for your event';
        
        const features = document.querySelectorAll('.demo-feature');
        features[0].querySelector('h3').textContent = 'Encrypted & Secure';
        features[0].querySelector('p').textContent = 'All data is encrypted and stored securely on GitHub';
        features[1].querySelector('h3').textContent = 'Custom Design';
        features[1].querySelector('p').textContent = 'Upload images, choose colors and fonts';
        features[2].querySelector('h3').textContent = 'Multiple Payment Methods';
        features[2].querySelector('p').textContent = 'Add as many payment options as you like';
        features[3].querySelector('h3').textContent = 'All Devices Supported';
        features[3].querySelector('p').textContent = 'Works great on desktop, tablet and smartphone';
        
        document.querySelector('.demo-cta h2').textContent = 'Want to create your own event?';
        document.querySelector('.demo-cta p').textContent = 'Contact the system administrator to get a link to the event creation form';
        
        const demoButtons = document.querySelectorAll('.demo-buttons a');
        if (demoButtons[0]) demoButtons[0].textContent = 'View Demo Page';
        if (demoButtons[1]) demoButtons[1].textContent = 'Learn More on GitHub';
    }
}

// Load config from encrypted URL or fallback to demo
async function loadConfig() {
    const eventId = new URLSearchParams(window.location.search).get('event');
    const key = window.location.hash.substring(1);
    
    // Check if loading demo event
    if (eventId === 'demo') {
        updateProgress(10, lang === 'en' ? 'Loading demo...' : 'טוען הדגמה...');
        try {
            const response = await fetch('demo-config.json');
            if (!response.ok) throw new Error('Demo config not found');
            updateProgress(50, lang === 'en' ? 'Loading demo...' : 'טוען הדגמה...');
            const config = await response.json();
            updateProgress(100, lang === 'en' ? 'Done!' : 'הושלם!');
            return config;
        } catch (err) {
            console.error('Failed to load demo:', err);
            showDemo();
            return null;
        }
    }
    
    // If no event ID, show landing page
    if (!eventId || !key) {
        showDemo();
        return null;
    }
    
    updateProgress(10, lang === 'en' ? 'Loading event...' : 'טוען אירוע...');
    
    if (eventId && key) {
        try {
            // Extract repo info from GitHub Pages URL
            // Format: https://username.github.io/repo-name/
            const hostname = window.location.hostname;
            const pathname = window.location.pathname;
            
            let githubUser, repoName, branch;
            
            if (hostname.endsWith('.github.io')) {
                // GitHub Pages URL
                githubUser = hostname.split('.')[0];
                const pathParts = pathname.split('/').filter(p => p);
                repoName = pathParts[0] || 'wedding_gifts';
                branch = 'multi-event-encrypted'; // Default branch for this platform
            } else {
                // Custom domain or local - use defaults
                githubUser = 'YOUR_USERNAME'; // Fallback
                repoName = 'wedding_gifts';
                branch = 'multi-event-encrypted';
            }
            
            const repo = `${githubUser}/${repoName}`;
            
            updateProgress(30, lang === 'en' ? 'Fetching config...' : 'מוריד הגדרות...');
            
            // Try jsDelivr CDN first (faster)
            const cdnUrl = `https://cdn.jsdelivr.net/gh/${repo}@${branch}/public/events/${eventId}/config.enc`;
            
            console.log(`Loading event from: ${cdnUrl}`);
            
            let response = await fetch(cdnUrl);
            
            // Fallback to GitHub raw if CDN fails
            if (!response.ok) {
                console.log('CDN failed, trying GitHub raw...');
                const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/public/events/${eventId}/config.enc`;
                response = await fetch(rawUrl);
            }
            
            updateProgress(50, lang === 'en' ? 'Decrypting...' : 'מפענח...');
            
            if (!response.ok) throw new Error('Config not found');
            
            const encrypted = await response.text();
            
            // Try multiple decryption methods for compatibility
            let configStr;
            try {
                if (typeof decryptConfig === 'function') {
                    console.log('Trying XOR decryption...');
                    configStr = await decryptConfig(encrypted, key);
                } else {
                    throw new Error('decrypt.js not loaded');
                }
            } catch (xorError) {
                console.log('XOR decryption failed, trying CryptoJS fallback:', xorError.message);
                // Fallback to CryptoJS for old events
                try {
                    const decrypted = CryptoJS.AES.decrypt(encrypted, key);
                    configStr = decrypted.toString(CryptoJS.enc.Utf8);
                    if (!configStr) throw new Error('CryptoJS decryption returned empty');
                    console.log('CryptoJS decryption succeeded!');
                } catch (cryptoError) {
                    console.log('CryptoJS also failed, trying base64:', cryptoError.message);
                    // Last resort: try plain base64
                    try {
                        configStr = atob(encrypted);
                    } catch (base64Error) {
                        throw new Error(`All decryption methods failed. XOR: ${xorError.message}, CryptoJS: ${cryptoError.message}`);
                    }
                }
            }
            
            if (!configStr) throw new Error('Decryption returned empty string');
            
            updateProgress(70, lang === 'en' ? 'Parsing data...' : 'מעבד נתונים...');
            
            const config = JSON.parse(configStr);
            
            // Validate structure
            if (!config.title || !config.message || !config.gifts) {
                throw new Error('Invalid config');
            }
            
            updateProgress(90, lang === 'en' ? 'Almost ready...' : 'כמעט מוכן...');
            
            return config;
        } catch (err) {
            console.error('Failed to load event:', err);
            alert(`Unable to load event: ${err.message}\n\nCheck console for details.`);
            return null;
        }
    }
    
    // Fallback to demo config
    return window.config;
}

// Load config and populate page
document.addEventListener('DOMContentLoaded', async () => {
    const config = await loadConfig();
    if (!config) {
        // Already handled by showDemo() or error display
        return;
    }
    
    updateProgress(95, lang === 'en' ? 'Rendering page...' : 'מציג דף...');
    
    // Show event page
    document.getElementById('event-page').style.display = 'block';
    
    // Get event details for image decryption
    const eventId = new URLSearchParams(window.location.search).get('event');
    const key = window.location.hash.substring(1);
    
    // Extract repo info
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    let githubUser, repoName, branch;
    
    if (hostname.endsWith('.github.io')) {
        githubUser = hostname.split('.')[0];
        const pathParts = pathname.split('/').filter(p => p);
        repoName = pathParts[0] || 'wedding_gifts';
        branch = 'multi-event-encrypted';
    } else {
        githubUser = 'YOUR_USERNAME';
        repoName = 'wedding_gifts';
        branch = 'multi-event-encrypted';
    }
    const repo = `${githubUser}/${repoName}`;
    
    // Update base href if repoName differs from default
    if (config.repoName && config.repoName !== 'gifter') {
        document.querySelector('base').href = `/${config.repoName}/`;
    }

    // Set background (with decryption if needed)
    const updateBackground = async () => {
        const isDark = document.body.classList.contains('dark');
        const bgImagePath = isDark ? config.backgroundDark : config.backgroundLight;
        
        if (bgImagePath) {
            let bgUrl;
            // Check if image is encrypted (.enc extension)
            if (bgImagePath.endsWith('.enc') && eventId && key) {
                console.log('Loading encrypted background:', bgImagePath);
                bgUrl = await loadEncryptedImage(bgImagePath, key, repo, branch);
            } else {
                bgUrl = bgImagePath;
            }
            
            if (bgUrl) {
                document.body.style.backgroundImage = `url(${bgUrl})`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundRepeat = 'no-repeat';
                document.body.style.backgroundAttachment = 'fixed';
            }
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

    await updateBackground();

    // Set title
    document.getElementById('title').textContent = config.title[lang];

    // Set message
    document.getElementById('message').textContent = config.message[lang];

    // Set image (with decryption if needed)
    const weddingImg = document.getElementById('wedding-img');
    if (config.image.endsWith('.enc') && eventId && key) {
        console.log('Loading encrypted wedding image:', config.image);
        const imageUrl = await loadEncryptedImage(config.image, key, repo, branch);
        if (imageUrl) {
            weddingImg.src = imageUrl;
            weddingImg.style.display = 'block';
        } else {
            weddingImg.style.display = 'none'; // Hide if can't load
        }
    } else if (config.image) {
        weddingImg.src = config.image;
        weddingImg.style.display = 'block';
    }

    updateProgress(100, lang === 'en' ? 'Done!' : 'הושלם!');
    
    // Hide loading overlay after a brief moment
    setTimeout(() => {
        hideLoading();
    }, 300);

    // Populate gifts
    const giftsContainer = document.getElementById('gifts');
    giftsContainer.innerHTML = '';
    config.gifts.forEach(gift => {
        // Select random URL if array
        gift.selectedUrl = Array.isArray(gift.url) ? gift.url[Math.floor(Math.random() * gift.url.length)] : gift.url;

        const giftDiv = document.createElement('div');
        giftDiv.className = 'gift';
        giftDiv.style.cursor = 'pointer'
        const img = document.createElement('img');
        img.src = gift.logo;
        img.alt = gift.name[lang];
        img.style.cursor = 'pointer';
        giftDiv.onclick = () => {
            window.open(gift.selectedUrl, '_blank');
        };

        const name = document.createElement('h3');
        name.textContent = gift.name[lang];

        const shareBtn = document.createElement('button');
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
    themeToggle.onclick = async () => {
        const currentTheme = document.body.classList.contains('light') ? 'light' : 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.body.classList.remove(currentTheme);
        document.body.classList.add(newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'light' ? 'Dark Mode' : 'Light Mode';
        await updateBackground();
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
        
        // Generate QR in temp div
        const tempDiv = document.createElement('div');
        new QRCode(tempDiv, {
            text: pageUrl,
            width: 512,
            height: 512,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        // Get the generated canvas
        const qrCanvas = tempDiv.querySelector('canvas');
        if (qrCanvas) {
            ctx.drawImage(qrCanvas, 0, 0);
        }
        
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