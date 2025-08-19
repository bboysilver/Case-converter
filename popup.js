const inputText = document.getElementById('inputText');
const outputArea = document.getElementById('outputArea');
const uppercaseBtn = document.getElementById('uppercaseBtn');
const lowercaseBtn = document.getElementById('lowercaseBtn');
const titlecaseBtn = document.getElementById('titlecaseBtn');
const sentencecaseBtn = document.getElementById('sentencecaseBtn');
const togglecaseBtn = document.getElementById('togglecaseBtn');
const copyBtn = document.getElementById('copyBtn');
const autoCapitalizeCheckbox = document.getElementById('autoCapitalizeCheckbox');

// Function to convert text to uppercase
function toUppercase(text) {
    return text.toUpperCase();
}

// Function to convert text to lowercase
function toLowercase(text) {
    return text.toLowerCase();
}

// Function to convert text to Title Case (first letter of each word capitalized)
function toTitleCase(text) {
    return text.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// Function to convert text to Sentence Case (first letter of each sentence capitalized)
function toSentenceCase(text) {
    // Capitalize the first letter after a period, question mark, or exclamation mark
    return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, function(c) {
        return c.toUpperCase();
    });
}

// Function to toggle the case of text
function toToggleCase(text) {
    return text.split('').map(function(char) {
        if (char === char.toUpperCase()) {
            return char.toLowerCase();
        }
        return char.toUpperCase();
    }).join('');
}

// Set up event listeners for popup buttons
uppercaseBtn.addEventListener('click', () => {
    outputArea.value = toUppercase(inputText.value);
});

lowercaseBtn.addEventListener('click', () => {
    outputArea.value = toLowercase(inputText.value);
});

titlecaseBtn.addEventListener('click', () => {
    outputArea.value = toTitleCase(inputText.value);
});

sentencecaseBtn.addEventListener('click', () => {
    outputArea.value = toSentenceCase(inputText.value);
});

togglecaseBtn.addEventListener('click', () => {
    outputArea.value = toToggleCase(inputText.value);
});

// Copy button click event listener
copyBtn.addEventListener('click', () => {
    outputArea.select(); // Select the text in outputArea
    document.execCommand('copy'); // Copy the selected text to the clipboard
    // Optional: Show a "Copy Complete!" message
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 1500);
});

// Save and load auto-capitalize checkbox state
autoCapitalizeCheckbox.addEventListener('change', () => {
    const isChecked = autoCapitalizeCheckbox.checked;
    chrome.storage.sync.set({ autoCapitalizeEnabled: isChecked }, () => {
        // Send a message to the background script to notify all tabs about the setting change
        chrome.runtime.sendMessage({ type: "autoCapitalizeSettingChange", enabled: isChecked });
        console.log('Auto-capitalize setting saved:', isChecked);
    });
});

// Load saved auto-capitalize setting when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get('autoCapitalizeEnabled', (data) => {
        autoCapitalizeCheckbox.checked = data.autoCapitalizeEnabled || false;
    });
});
