/**
 * ============================================
 * QUOTE GENERATOR APPLICATION
 * ============================================
 * A modern quote generator with API integration,
 * favorites system, dark mode, and social sharing
 */

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

const CONFIG = {
    API_URL: 'https://api.quotable.io/random',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    ANIMATION_DELAY: 200,  // Reduced from 400ms to 200ms
    NOTIFICATION_DURATION: 2000,
    ERROR_NOTIFICATION_DURATION: 3000
};

const STORAGE_KEYS = {
    FAVORITES: 'favoriteQuotes',
    DARK_MODE: 'darkMode'
};

// ============================================
// STATIC DATA
// ============================================

const FALLBACK_QUOTES = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
    { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
    { text: "Believe in yourself. You are braver than you think, more talented than you know, and capable of more than you imagine.", author: "Roy T. Bennett" },
    { text: "I learned that courage was not the absence of fear, but the triumph over it.", author: "Nelson Mandela" },
    { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
    { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
    { text: "Success is not how high you have climbed, but how you make a positive difference to the world.", author: "Roy T. Bennett" }
];

// ============================================
// DOM ELEMENTS (Cached for performance)
// ============================================

const DOM = {
    // Quote display
    quoteText: document.getElementById('quoteText'),
    quoteAuthor: document.getElementById('quoteAuthor'),
    quoteContent: document.getElementById('quoteContent'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    
    // Buttons
    newQuoteBtn: document.getElementById('newQuoteBtn'),
    copyBtn: document.getElementById('copyBtn'),
    tweetBtn: document.getElementById('tweetBtn'),
    favoriteBtn: document.getElementById('favoriteBtn'),
    themeToggle: document.getElementById('themeToggle'),
    
    // Favorites
    viewFavoritesBtn: document.getElementById('viewFavoritesBtn'),
    favoritesCount: document.getElementById('favoritesCount'),
    favoritesModal: document.getElementById('favoritesModal'),
    closeFavoritesBtn: document.getElementById('closeFavoritesBtn'),
    favoritesList: document.getElementById('favoritesList'),
    clearFavoritesBtn: document.getElementById('clearFavoritesBtn'),
    
    // Filters
    categoryFilter: document.getElementById('categoryFilter')
};

// ============================================
// APPLICATION STATE
// ============================================

const State = {
    lastQuoteIndex: -1,
    isLoading: false,
    apiFailureCount: 0,
    usingFallback: false,
    currentQuote: { text: '', author: '' },
    favorites: [],
    isDarkMode: false
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Creates a delay using Promise
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates a unique key for a quote
 * @param {Object} quote - Quote object with text and author
 * @returns {string} Unique key
 */
const getQuoteKey = (quote) => `${quote.text}|${quote.author}`;

/**
 * Formats quote for sharing
 * @param {Object} quote - Quote object
 * @returns {string} Formatted quote text
 */
const formatQuoteText = (quote) => `"${quote.text}" - ${quote.author}`;

// ============================================
// LOCAL STORAGE MANAGEMENT
// ============================================

const Storage = {
    /**
     * Load favorites from localStorage
     * @returns {Array} Array of favorite quotes
     */
    loadFavorites() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading favorites:', error);
            return [];
        }
    },
    
    /**
     * Save favorites to localStorage
     * @param {Array} favorites - Array of favorite quotes
     */
    saveFavorites(favorites) {
        try {
            localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    },
    
    /**
     * Load dark mode preference
     * @returns {boolean} Dark mode enabled
     */
    loadDarkMode() {
        return localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
    },
    
    /**
     * Save dark mode preference
     * @param {boolean} isDark - Dark mode state
     */
    saveDarkMode(isDark) {
        localStorage.setItem(STORAGE_KEYS.DARK_MODE, isDark);
    }
};

// ============================================
// API FUNCTIONS
// ============================================

const API = {
    /**
     * Fetch quote from API with retry logic
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<Object>} Quote object
     */
    async fetchQuote(retryCount = 0) {
        try {
            const response = await fetch(CONFIG.API_URL);
            
            if (!response.ok) {
                throw new Error(`API request failed with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Reset failure tracking on success
            State.apiFailureCount = 0;
            State.usingFallback = false;
            
            return {
                text: data.content,
                author: data.author,
                source: 'api'
            };
        } catch (error) {
            console.error(`API error (attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES}):`, error);
            
            // Retry if attempts remaining
            if (retryCount < CONFIG.MAX_RETRIES - 1) {
                console.log(`Retrying in ${CONFIG.RETRY_DELAY}ms...`);
                await sleep(CONFIG.RETRY_DELAY);
                return this.fetchQuote(retryCount + 1);
            }
            
            // All retries failed - use fallback
            State.apiFailureCount++;
            State.usingFallback = true;
            console.warn('API unavailable. Using fallback quotes.');
            
            return {
                ...QuoteManager.getRandomFallback(),
                source: 'fallback'
            };
        }
    }
};

// ============================================
// QUOTE MANAGEMENT
// ============================================

const QuoteManager = {
    /**
     * Get random quote from fallback data
     * @returns {Object} Quote object
     */
    getRandomFallback() {
        // Handle edge case of single quote
        if (FALLBACK_QUOTES.length === 1) {
            return FALLBACK_QUOTES[0];
        }
        
        // Ensure no immediate repetition
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
        } while (randomIndex === State.lastQuoteIndex);
        
        State.lastQuoteIndex = randomIndex;
        return FALLBACK_QUOTES[randomIndex];
    },
    
    /**
     * Display quote with optimized animation
     * @param {Object} quote - Quote object to display
     */
    async display(quote) {
        // Start fade out and API notification simultaneously
        this.fadeOut();
        
        // Show notification if using fallback for first time
        if (quote.source === 'fallback' && State.apiFailureCount === 1) {
            UI.showNotification('⚠️ API unavailable. Using offline quotes.', 'error');
        }
        
        // Reduced wait time for faster transition
        await sleep(CONFIG.ANIMATION_DELAY);
        
        // Update state and DOM
        State.currentQuote = { text: quote.text, author: quote.author };
        this.updateDOM(quote);
        
        // Fade in new quote
        this.fadeIn();
        
        // Update UI state
        FavoritesManager.updateButton();
    },
    
    /**
     * Update DOM with quote data
     * @param {Object} quote - Quote object
     */
    updateDOM(quote) {
        DOM.quoteText.textContent = quote.text;
        DOM.quoteAuthor.textContent = `- ${quote.author}`;
        
        // Add offline indicator if using fallback
        if (quote.source === 'fallback') {
            DOM.quoteAuthor.textContent += ' (Offline)';
        }
    },
    
    /**
     * Fade out quote elements with faster transition
     */
    fadeOut() {
        DOM.quoteText.style.opacity = '0';
        DOM.quoteText.style.transform = 'translateY(-10px)';
        DOM.quoteAuthor.style.opacity = '0';
        DOM.quoteAuthor.style.transform = 'translateY(-10px)';
    },
    
    /**
     * Fade in quote elements
     */
    fadeIn() {
        DOM.quoteText.style.opacity = '1';
        DOM.quoteText.style.transform = 'translateY(0)';
        DOM.quoteAuthor.style.opacity = '1';
        DOM.quoteAuthor.style.transform = 'translateY(0)';
    }
};

// ============================================
// UI MANAGEMENT
// ============================================

const UI = {
    /**
     * Show loading state
     */
    showLoading() {
        State.isLoading = true;
        DOM.newQuoteBtn.disabled = true;
        DOM.newQuoteBtn.innerHTML = '<span class="btn-icon">⏳</span>Loading...';
        DOM.loadingSpinner.classList.add('active');
        DOM.quoteContent.classList.add('loading');
    },
    
    /**
     * Hide loading state
     */
    hideLoading() {
        State.isLoading = false;
        DOM.newQuoteBtn.disabled = false;
        DOM.newQuoteBtn.innerHTML = '<span class="btn-icon">✨</span>New Quote';
        DOM.loadingSpinner.classList.remove('active');
        DOM.quoteContent.classList.remove('loading');
    },
    
    /**
     * Show notification message
     * @param {string} message - Notification text
     * @param {string} type - Notification type ('success' or 'error')
     */
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        
        // Set background based on type
        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after duration
        const duration = type === 'error' ? CONFIG.ERROR_NOTIFICATION_DURATION : CONFIG.NOTIFICATION_DURATION;
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
};

// ============================================
// FAVORITES MANAGEMENT
// ============================================

const FavoritesManager = {
    /**
     * Toggle favorite status of current quote
     */
    toggle() {
        const quoteKey = getQuoteKey(State.currentQuote);
        const index = State.favorites.findIndex(fav => getQuoteKey(fav) === quoteKey);
        
        if (index > -1) {
            // Remove from favorites
            State.favorites.splice(index, 1);
            UI.showNotification('💔 Removed from favorites');
        } else {
            // Add to favorites
            State.favorites.push({ ...State.currentQuote, timestamp: Date.now() });
            UI.showNotification('❤️ Added to favorites!');
        }
        
        // Persist changes
        Storage.saveFavorites(State.favorites);
        this.updateButton();
        this.updateCount();
    },
    
    /**
     * Update favorite button state
     */
    updateButton() {
        const quoteKey = getQuoteKey(State.currentQuote);
        const isFavorite = State.favorites.some(fav => getQuoteKey(fav) === quoteKey);
        
        DOM.favoriteBtn.classList.toggle('active', isFavorite);
        DOM.favoriteBtn.innerHTML = `<span class="btn-icon">${isFavorite ? '❤️' : '🤍'}</span>`;
    },
    
    /**
     * Update favorites count display
     */
    updateCount() {
        DOM.favoritesCount.textContent = State.favorites.length;
    },
    
    /**
     * Show favorites modal
     */
    showModal() {
        if (State.favorites.length === 0) {
            DOM.favoritesList.innerHTML = '<p class="no-favorites">No favorite quotes yet. Click the heart icon to save quotes!</p>';
        } else {
            DOM.favoritesList.innerHTML = State.favorites.map((fav, index) => `
                <div class="favorite-item">
                    <p class="favorite-item-text">"${fav.text}"</p>
                    <p class="favorite-item-author">- ${fav.author}</p>
                    <div class="favorite-item-actions">
                        <button class="btn btn-secondary btn-small" onclick="FavoritesManager.copy(${index})">
                            <span class="btn-icon">📋</span> Copy
                        </button>
                        <button class="btn btn-danger btn-small" onclick="FavoritesManager.remove(${index})">
                            <span class="btn-icon">🗑️</span> Remove
                        </button>
                    </div>
                </div>
            `).join('');
        }
        DOM.favoritesModal.classList.add('show');
    },
    
    /**
     * Hide favorites modal
     */
    hideModal() {
        DOM.favoritesModal.classList.remove('show');
    },
    
    /**
     * Copy favorite quote to clipboard
     * @param {number} index - Index of favorite to copy
     */
    copy(index) {
        const fav = State.favorites[index];
        const text = formatQuoteText(fav);
        
        navigator.clipboard.writeText(text)
            .then(() => UI.showNotification('✅ Quote copied!'))
            .catch(err => console.error('Copy failed:', err));
    },
    
    /**
     * Remove favorite quote
     * @param {number} index - Index of favorite to remove
     */
    remove(index) {
        State.favorites.splice(index, 1);
        Storage.saveFavorites(State.favorites);
        this.updateCount();
        this.showModal(); // Refresh display
        UI.showNotification('💔 Removed from favorites');
    },
    
    /**
     * Clear all favorites with confirmation
     */
    clearAll() {
        if (confirm('Are you sure you want to clear all favorites?')) {
            State.favorites = [];
            Storage.saveFavorites(State.favorites);
            this.updateCount();
            this.updateButton();
            this.hideModal();
            UI.showNotification('🗑️ All favorites cleared');
        }
    }
};

// ============================================
// SHARING FUNCTIONS
// ============================================

const Sharing = {
    /**
     * Copy current quote to clipboard
     */
    copyToClipboard() {
        const text = formatQuoteText(State.currentQuote);
        
        navigator.clipboard.writeText(text)
            .then(() => UI.showNotification('✅ Quote copied to clipboard!'))
            .catch(err => {
                console.error('Copy failed:', err);
                UI.showNotification('❌ Failed to copy quote', 'error');
            });
    },
    
    /**
     * Share quote on Twitter
     */
    shareOnTwitter() {
        const text = formatQuoteText(State.currentQuote);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank');
    }
};

// ============================================
// THEME MANAGEMENT
// ============================================

const ThemeManager = {
    /**
     * Toggle dark mode
     */
    toggle() {
        State.isDarkMode = !State.isDarkMode;
        document.body.classList.toggle('dark-mode', State.isDarkMode);
        Storage.saveDarkMode(State.isDarkMode);
        this.updateIcon();
    },
    
    /**
     * Update theme toggle icon
     */
    updateIcon() {
        const themeIcon = DOM.themeToggle.querySelector('.theme-icon');
        themeIcon.textContent = State.isDarkMode ? '☀️' : '🌙';
    },
    
    /**
     * Initialize theme on page load
     */
    initialize() {
        State.isDarkMode = Storage.loadDarkMode();
        if (State.isDarkMode) {
            document.body.classList.add('dark-mode');
            this.updateIcon();
        }
    }
};

// ============================================
// EVENT HANDLERS
// ============================================

const EventHandlers = {
    /**
     * Handle new quote button click
     */
    async handleNewQuote() {
        if (State.isLoading) return;
        
        UI.showLoading();
        const quote = await API.fetchQuote();
        await QuoteManager.display(quote);
        UI.hideLoading();
    },
    
    /**
     * Initialize all event listeners
     */
    initialize() {
        // Quote actions
        DOM.newQuoteBtn.addEventListener('click', this.handleNewQuote);
        DOM.copyBtn.addEventListener('click', () => Sharing.copyToClipboard());
        DOM.tweetBtn.addEventListener('click', () => Sharing.shareOnTwitter());
        
        // Favorites
        DOM.favoriteBtn.addEventListener('click', () => FavoritesManager.toggle());
        DOM.viewFavoritesBtn.addEventListener('click', () => FavoritesManager.showModal());
        DOM.closeFavoritesBtn.addEventListener('click', () => FavoritesManager.hideModal());
        DOM.clearFavoritesBtn.addEventListener('click', () => FavoritesManager.clearAll());
        
        // Theme
        DOM.themeToggle.addEventListener('click', () => ThemeManager.toggle());
        
        // Modal close on outside click
        DOM.favoritesModal.addEventListener('click', (e) => {
            if (e.target === DOM.favoritesModal) {
                FavoritesManager.hideModal();
            }
        });
    }
};

// ============================================
// APPLICATION INITIALIZATION
// ============================================

const App = {
    /**
     * Initialize application
     */
    async initialize() {
        console.log('🚀 Initializing Quote Generator...');
        
        // Load saved data
        State.favorites = Storage.loadFavorites();
        
        // Initialize theme
        ThemeManager.initialize();
        
        // Setup event listeners
        EventHandlers.initialize();
        
        // Update UI
        FavoritesManager.updateCount();
        
        // Load initial quote
        await this.loadInitialQuote();
        
        console.log('✅ Quote Generator ready!');
    },
    
    /**
     * Load initial quote on page load
     */
    async loadInitialQuote() {
        UI.showLoading();
        
        try {
            const quote = await API.fetchQuote();
            State.currentQuote = { text: quote.text, author: quote.author };
            QuoteManager.updateDOM(quote);
            
            if (quote.source === 'fallback') {
                UI.showNotification('⚠️ API unavailable. Using offline quotes.', 'error');
            }
            
            FavoritesManager.updateButton();
        } catch (error) {
            console.error('Critical error on page load:', error);
            
            // Fallback to static quote
            const fallbackQuote = QuoteManager.getRandomFallback();
            State.currentQuote = { text: fallbackQuote.text, author: fallbackQuote.author };
            DOM.quoteText.textContent = fallbackQuote.text;
            DOM.quoteAuthor.textContent = `- ${fallbackQuote.author} (Offline)`;
            UI.showNotification('⚠️ Unable to load quotes. Using offline mode.', 'error');
        } finally {
            UI.hideLoading();
        }
    }
};

// ============================================
// START APPLICATION
// ============================================

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => App.initialize());
