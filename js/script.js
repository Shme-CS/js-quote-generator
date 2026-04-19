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

// Track last displayed quote to prevent immediate repetition
let lastQuoteIndex = -1;
let isLoading = false;
let apiFailureCount = 0;
let usingFallback = false;

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
}

// Function to hide loading state
function hideLoading() {
    isLoading = false;
    newQuoteBtn.disabled = false;
    newQuoteBtn.innerHTML = '<span class="btn-icon">✨</span>New Quote';
}

// Function to display quote with animation
async function displayQuote() {
    if (isLoading) return;
    
    showLoading();
    
    // Add fade out effect
    quoteText.style.opacity = '0';
    quoteAuthor.style.opacity = '0';
    
    // Fetch new quote from API
    const quote = await fetchQuoteFromAPI();
    
    // Show notification if using fallback
    if (quote.source === 'fallback' && apiFailureCount === 1) {
        showErrorNotification('⚠️ API unavailable. Using offline quotes.');
    }
    
    setTimeout(() => {
        quoteText.textContent = quote.text;
        quoteAuthor.textContent = `- ${quote.author}`;
        
        // Add source indicator
        if (quote.source === 'fallback') {
            quoteAuthor.textContent += ' (Offline)';
        }
        
        // Add fade in effect
        quoteText.style.opacity = '1';
        quoteAuthor.style.opacity = '1';
        
        hideLoading();
    }, 300);
}

// Event Listeners
newQuoteBtn.addEventListener('click', displayQuote);

// Display random quote on page load
window.addEventListener('DOMContentLoaded', async () => {
    showLoading();
    
    try {
        // Fetch initial quote from API
        const quote = await fetchQuoteFromAPI();
        quoteText.textContent = quote.text;
        quoteAuthor.textContent = `- ${quote.author}`;
        
        // Add source indicator
        if (quote.source === 'fallback') {
            quoteAuthor.textContent += ' (Offline)';
            showErrorNotification('⚠️ API unavailable. Using offline quotes.');
        }
    } catch (error) {
        console.error('Critical error on page load:', error);
        // Show fallback quote
        const fallbackQuote = getRandomQuote();
        quoteText.textContent = fallbackQuote.text;
        quoteAuthor.textContent = `- ${fallbackQuote.author} (Offline)`;
        showErrorNotification('⚠️ Unable to load quotes. Using offline mode.');
    } finally {
        hideLoading();
    }
});

console.log('Quote Generator initialized with API integration');
