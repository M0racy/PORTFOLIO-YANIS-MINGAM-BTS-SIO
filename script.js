let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');
let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {
    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop - 150;
        let height = sec.offsetHeight;
        let id = sec.getAttribute('id');

        if(top >= offset && top < offset + height){
            navLinks.forEach(links => {
                links.classList.remove('active');
                document.querySelector('header nav a [href*=' + id + ' ]').classList.add
                ('active')
            })
        }
    })
}


menuIcon.onclick = () => {
    menuIcon.classList.toggle('bx-x');
    navbar.classList.toggle('active');
}

const apiKey = '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';

const categories = {
    cybersecurity: ["cybersecurity-news-1", "cybersecurity-news-2", "cybersecurity-news-3"],
    ai: ["ai-news-1", "ai-news-2", "ai-news-3"],
    network: ["network-news-1", "network-news-2", "network-news-3"]
};

const CACHE_KEY_PREFIX = "cachedNews_";
const CACHE_TIME_KEY_PREFIX = "cacheTimestamp_";
const CACHE_DURATION = 24 * 60 * 60 * 1000 * 7; // 24 heures

async function fetchNews(category, query) {
    try {
        const cacheKey = CACHE_KEY_PREFIX + category;
        const cacheTimeKey = CACHE_TIME_KEY_PREFIX + category;
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTimestamp = localStorage.getItem(cacheTimeKey);
        const now = Date.now();

        if (cachedData && cachedTimestamp && now - cachedTimestamp < CACHE_DURATION) {
            console.log(`Using cached news data for ${category}`);
            displayArticles(category, JSON.parse(cachedData));
            return;
        }

        let validArticles = [];
        let attempts = 0;

        while (validArticles.length < 3 && attempts < 5) { // Max 5 retry attempts
            const response = await fetch(`https://api.perplexity.ai/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: "sonar",
                    messages: [{ role: "user", content: query }],
                    temperature: 0.7
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();
            console.log(`API Response for ${category}:`, data);

            const articlesText = data?.choices?.[0]?.message?.content;
            const articles = articlesText.split('\n').filter(line => line.trim() !== '');

            validArticles = articles.filter(article => article.includes(' - '));
            attempts++;
        }

        if (validArticles.length >= 3) {
            localStorage.setItem(cacheKey, JSON.stringify(validArticles));
            localStorage.setItem(cacheTimeKey, now);
            displayArticles(category, validArticles);
        } else {
            displayError(category, 'Articles insuffisants.');
        }
    } catch (error) {
        console.error(`Erreur de chargement des articles pour ${category}:`, error);
        displayError(category, 'Erreur lors de la récupération des actualités.');
    }
}

function displayArticles(category, articles) {
    categories[category].forEach((elementId, index) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        const [title, url] = articles[index].split(' - ');
        if (title && url) {
            element.innerHTML = `<a href="${url.trim()}" target="_blank">${title.trim()}</a>`;
        } else {
            element.innerHTML = '<p>Article format incorrect.</p>';
        }
    });
}

function displayError(category, message) {
    categories[category].forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) element.innerHTML = `<p>${message}</p>`;
    });
}

// Récupération des articles pour chaque catégorie avec retry en cas d'erreur
fetchNews("cybersecurity", "Provide exactly 3 different French cybersecurity news articles and verify if url work well. Each article should be a single line with the title and URL only, separated by a hyphen (-). No additional comments.");
fetchNews("ai", "Provide exactly 3 different French AI news articles and verify if url work well. Each article should be a single line with the title and URL only, separated by a hyphen (-). No additional comments.");
fetchNews("network", "Provide exactly 3 different French IT and network news articles and verify if url work well. Each article should be a single line with the title and URL only, separated by a hyphen (-). No additional comments.");