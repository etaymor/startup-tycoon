/**
 * Startup Tycoon - Helper Utilities
 * Various helper functions used throughout the game
 */

/**
 * Format a number as a currency string
 * @param {number} amount - Amount to format
 * @param {boolean} shortenLarge - Whether to use K/M/B for large numbers
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, shortenLarge = false) {
  if (shortenLarge && Math.abs(amount) >= 1000000000) {
    return "$" + (amount / 1000000000).toFixed(1) + "B";
  } else if (shortenLarge && Math.abs(amount) >= 1000000) {
    return "$" + (amount / 1000000).toFixed(1) + "M";
  } else if (shortenLarge && Math.abs(amount) >= 1000) {
    return "$" + (amount / 1000).toFixed(1) + "K";
  } else {
    return "$" + amount.toLocaleString();
  }
}

/**
 * Format a number as a compact string with K/M/B suffixes
 * @param {number} num - Number to format
 * @returns {string} Formatted string
 */
function formatNumber(num) {
  if (Math.abs(num) >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  } else if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  } else {
    return num.toString();
  }
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Pick a random item from an array
 * @param {Array} array - Array to pick from
 * @returns {*} Random item from the array
 */
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Debounce a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait between calls
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Log a message with a timestamp and category
 * @param {string} message - Message to log
 * @param {string} category - Category for the log
 */
function gameLog(message, category = "INFO") {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}][${category}] ${message}`);
}
