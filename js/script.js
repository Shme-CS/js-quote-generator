// Quote Generator JavaScript

// API Configuration
const API_URL = 'https://api.quotable.io/random';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Static Quote Data (Fallback)
const quotes = [
    {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs"
    },
    {
        text: "Innovation distinguishes between a leader and a follower.",
        author: "Steve Jobs"
    },
    {
        text: "Life is what happens when you're busy making other plans.",
        author: "John Lennon"
    },
    {
        text: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt"
    },
    {
        text: "It is during our darkest moments that we must focus to see the light.",
        author: "Aristotle"
    },
    {
        text: "The only impossible journey is the one you never begin.",
        author: "Tony Robbins"
    },
    {
        text: "In the middle of difficulty lies opportunity.",
        author: "Albert Einstein"
    },
    {
        text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill"
    },
    {
        text: "Believe you can and you're halfway there.",
        author: "Theodore Roosevelt"
    },
    {
        text: "The best time to plant a tree was 20 years ago. The second best time is now.",
        author: "Chinese Proverb"
    },
    {
        text: "Your time is limited, don't waste it living someone else's life.",
        author: "Steve Jobs"
    },
    {
        text: "The way to get started is to quit talking and begin doing.",
        author: "Walt Disney"
    },
    {
        text: "Don't watch the clock; do what it does. Keep going.",
        author: "Sam Levenson"
    },
    {
        text: "The future depends on what you do today.",
        author: "Mahatma Gandhi"
    },
    {
        text: "Everything you've ever wanted is on the other side of fear.",
        author: "George Addair"
    },
    {
        text: "Believe in yourself. You are braver than you think, more talented than you know, and capable of more than you imagine.",
        author: "Roy T. Bennett"
    },
    {
        text: "I learned that courage was not the absence of fear, but the triumph over it.",
        author: "Nelson Mandela"
    },
    {
        text: "The only limit to our realization of tomorrow is our doubts of today.",
        author: "Franklin D. Roosevelt"
    },
    {
        text: "Do what you can, with what you have, where you are.",
        author: "Theodore Roosevelt"
    },
    {
        text: "Success is not how high you have climbed, but how you make a positive difference to the world.",
        author: "Roy T. Bennett"
    }
];

// DOM Elements
const quoteText = document.getElementById('quoteText');
const quoteAuthor = document.getElementById('quoteAuthor');
const newQuoteBtn = document.getElementById('newQuoteBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const quoteContent = document.getElementById('quoteContent');
const copyBtn = document.getElementById('copyBtn');
const tweetBtn = document.getElementById('tweetBtn');
const favoriteBtn = document.getElementById('favoriteBtn');
const categoryFilter = document.getElementById('categoryFilter');
const viewFavoritesBtn = document.getElementById('viewFavoritesBtn');
const favoritesCount = document.getElementById('favoritesCount');
const favoritesModal = document.getElementById('favoritesModal');
const closeFavoritesBtn = document.getElementById('closeFavoritesBtn');
const favoritesList = document.getElementById('favoritesList');
const clearFavoritesBtn = document.getElementById('clearFavoritesBtn');
const themeToggle = document.getElementById('themeToggle');

// Track last displayed quote to prevent immediate repetition
let lastQuoteIndex = -1;
let isLoading = false;
let apiFailureCount = 0;
let usingFallback = false;
let currentQuote = { text: '', author: '' };
let favorites = JSON.parse(localStorage.getItem('favoriteQuotes')) || [];
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// Function to sleep/delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to fetch quote from API with retry logic
async function fetchQuoteFromAPI(retryCount = 0) {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Reset failure count on success
        apiFailureCount = 0;
        usingFallback = false;
        
        return {
            text: data.content,
            author: data.author,
            source: 'api'
        };
    } catch (error) {
        console.error(`Error fetching quote from API (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
        
        // Retry logic
        if (retryCount < MAX_RETRIES - 1) {
            console.log(`Retrying in ${RETRY_DELAY}ms...`);
            await sleep(RETRY_DELAY);
            return fetchQuoteFromAPI(retryCount + 1);
        }
        
        // All retries failed
        apiFailureCount++;
        usingFallback = true;
        console.warn('API unavailable. Using fallback quotes.');
        
        // Return fallback quote
        return {
            ...getRandomQuote(),
            source: 'fallback'
        };
    }
}

// Function to show error notification
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Function to get random quote from static data (fallback)
function getRandomQuote() {
    let randomIndex;
    
    // If there's only one quote, return it
    if (quotes.length === 1) {
        return quotes[0];
    }
    
    // Keep generating random index until it's different from last one
    do {
        randomIndex = Math.floor(Math.random() * quotes.length);
    } while (randomIndex === lastQuoteIndex);
    
    // Update last quote index
    lastQuoteIndex = randomIndex;
    
    return quotes[randomIndex];
}

// Function to show loading state
function showLoading() {
    isLoading = true;
    newQuoteBtn.disabled = true;
    newQuoteBtn.innerHTML = '<span class="btn-icon">⏳</span>Loading...';
    loadingSpinner.classList.add('active');
    quoteContent.classList.add('loading');
}

// Function to hide loading state
function hideLoading() {
    isLoading = false;
    newQuoteBtn.disabled = false;
    newQuoteBtn.innerHTML = '<span class="btn-icon">✨</span>New Quote';
    loadingSpinner.classList.remove('active');
    quoteContent.classList.remove('loading');
}

// Function to display quote with animation
async function displayQuote() {
    if (isLoading) return;
    
    showLoading();
    
    // Add fade out effect with scale
    quoteText.style.opacity = '0';
    quoteText.style.transform = 'translateY(-10px)';
    quoteAuthor.style.opacity = '0';
    quoteAuthor.style.transform = 'translateY(-10px)';
    
    // Fetch new quote from API
    const quote = await fetchQuoteFromAPI();
    
    // Show notification if using fallback
    if (quote.source === 'fallback' && apiFailureCount === 1) {
        showErrorNotification('⚠️ API unavailable. Using offline quotes.');
    }
    
    setTimeout(() => {
        currentQuote = { text: quote.text, author: quote.author };
        quoteText.textContent = quote.text;
        quoteAuthor.textContent = `- ${quote.author}`;
        
        // Add source indicator
        if (quote.source === 'fallback') {
            quoteAuthor.textContent += ' (Offline)';
        }
        
        // Update favorite button state
        updateFavoriteButton();
        
        // Add fade in effect with scale
        quoteText.style.opacity = '1';
        quoteText.style.transform = 'translateY(0)';
        quoteAuthor.style.opacity = '1';
        quoteAuthor.style.transform = 'translateY(0)';
        
        hideLoading();
    }, 400);
}

// Copy quote to clipboard
function copyQuote() {
    const text = `"${currentQuote.text}" - ${currentQuote.author}`;
    navigator.clipboard.writeText(text).then(() => {
        showSuccessNotification('✅ Quote copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showErrorNotification('❌ Failed to copy quote');
    });
}

// Tweet quote
function tweetQuote() {
    const text = `"${currentQuote.text}" - ${currentQuote.author}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank');
}

// Toggle favorite
function toggleFavorite() {
    const quoteKey = `${currentQuote.text}|${currentQuote.author}`;
    const index = favorites.findIndex(fav => `${fav.text}|${fav.author}` === quoteKey);
    
    if (index > -1) {
        // Remove from favorites
        favorites.splice(index, 1);
        showSuccessNotification('💔 Removed from favorites');
    } else {
        // Add to favorites
        favorites.push({ ...currentQuote, timestamp: Date.now() });
        showSuccessNotification('❤️ Added to favorites!');
    }
    
    // Save to localStorage
    localStorage.setItem('favoriteQuotes', JSON.stringify(favorites));
    updateFavoriteButton();
    updateFavoritesCount();
}

// Update favorite button state
function updateFavoriteButton() {
    const quoteKey = `${currentQuote.text}|${currentQuote.author}`;
    const isFavorite = favorites.some(fav => `${fav.text}|${fav.author}` === quoteKey);
    
    if (isFavorite) {
        favoriteBtn.classList.add('active');
        favoriteBtn.innerHTML = '<span class="btn-icon">❤️</span>';
    } else {
        favoriteBtn.classList.remove('active');
        favoriteBtn.innerHTML = '<span class="btn-icon">🤍</span>';
    }
}

// Update favorites count
function updateFavoritesCount() {
    favoritesCount.textContent = favorites.length;
}

// Show success notification
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.style.background = 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Show favorites modal
function showFavoritesModal() {
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="no-favorites">No favorite quotes yet. Click the heart icon to save quotes!</p>';
    } else {
        favoritesList.innerHTML = favorites.map((fav, index) => `
            <div class="favorite-item">
                <p class="favorite-item-text">"${fav.text}"</p>
                <p class="favorite-item-author">- ${fav.author}</p>
                <div class="favorite-item-actions">
                    <button class="btn btn-secondary btn-small" onclick="copyFavorite(${index})">
                        <span class="btn-icon">📋</span> Copy
                    </button>
                    <button class="btn btn-danger btn-small" onclick="removeFavorite(${index})">
                        <span class="btn-icon">🗑️</span> Remove
                    </button>
                </div>
            </div>
        `).join('');
    }
    favoritesModal.classList.add('show');
}

// Hide favorites modal
function hideFavoritesModal() {
    favoritesModal.classList.remove('show');
}

// Copy favorite quote
function copyFavorite(index) {
    const fav = favorites[index];
    const text = `"${fav.text}" - ${fav.author}`;
    navigator.clipboard.writeText(text).then(() => {
        showSuccessNotification('✅ Quote copied!');
    });
}

// Remove favorite quote
function removeFavorite(index) {
    favorites.splice(index, 1);
    localStorage.setItem('favoriteQuotes', JSON.stringify(favorites));
    updateFavoritesCount();
    showFavoritesModal(); // Refresh the list
    showSuccessNotification('💔 Removed from favorites');
}

// Clear all favorites
function clearAllFavorites() {
    if (confirm('Are you sure you want to clear all favorites?')) {
        favorites = [];
        localStorage.setItem('favoriteQuotes', JSON.stringify(favorites));
        updateFavoritesCount();
        updateFavoriteButton();
        hideFavoritesModal();
        showSuccessNotification('🗑️ All favorites cleared');
    }
}

// Toggle dark mode
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
    
    // Update icon
    const themeIcon = themeToggle.querySelector('.theme-icon');
    themeIcon.textContent = isDarkMode ? '☀️' : '🌙';
}

// Initialize dark mode
function initializeDarkMode() {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        const themeIcon = themeToggle.querySelector('.theme-icon');
        themeIcon.textContent = '☀️';
    }
}

// Event Listeners
newQuoteBtn.addEventListener('click', displayQuote);
copyBtn.addEventListener('click', copyQuote);
tweetBtn.addEventListener('click', tweetQuote);
favoriteBtn.addEventListener('click', toggleFavorite);
viewFavoritesBtn.addEventListener('click', showFavoritesModal);
closeFavoritesBtn.addEventListener('click', hideFavoritesModal);
clearFavoritesBtn.addEventListener('click', clearAllFavorites);
themeToggle.addEventListener('click', toggleDarkMode);

// Close modal on outside click
favoritesModal.addEventListener('click', (e) => {
    if (e.target === favoritesModal) {
        hideFavoritesModal();
    }
});

// Display random quote on page load
window.addEventListener('DOMContentLoaded', async () => {
    initializeDarkMode();
    showLoading();
    updateFavoritesCount();
    
    try {
        // Fetch initial quote from API
        const quote = await fetchQuoteFromAPI();
        currentQuote = { text: quote.text, author: quote.author };
        quoteText.textContent = quote.text;
        quoteAuthor.textContent = `- ${quote.author}`;
        
        // Add source indicator
        if (quote.source === 'fallback') {
            quoteAuthor.textContent += ' (Offline)';
            showErrorNotification('⚠️ API unavailable. Using offline quotes.');
        }
        
        updateFavoriteButton();
    } catch (error) {
        console.error('Critical error on page load:', error);
        // Show fallback quote
        const fallbackQuote = getRandomQuote();
        currentQuote = { text: fallbackQuote.text, author: fallbackQuote.author };
        quoteText.textContent = fallbackQuote.text;
        quoteAuthor.textContent = `- ${fallbackQuote.author} (Offline)`;
        showErrorNotification('⚠️ Unable to load quotes. Using offline mode.');
    } finally {
        hideLoading();
    }
});

console.log('Quote Generator initialized with API integration');
