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

// Receive messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "convertText") {
        // Get the currently active element and its selection
        const activeElement = document.activeElement;
        let convertedText = "";

        // Perform the conversion based on the message's conversionType
        switch (message.conversionType) {
            case "uppercase": convertedText = toUppercase(message.text); break;
            case "lowercase": convertedText = toLowercase(message.text); break;
            case "titlecase": convertedText = toTitleCase(message.text); break;
            case "sentencecase": convertedText = toSentenceCase(message.text); break;
            case "togglecase": convertedText = toToggleCase(message.text); break;
            default:
                console.error("Content script: Unknown conversion type received:", message.conversionType);
                return;
        }

        // Replace the selected text in the active element
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            activeElement.value = activeElement.value.substring(0, start) + convertedText + activeElement.value.substring(end);
            activeElement.setSelectionRange(start, start + convertedText.length); // Maintain selection
        } else if (activeElement && activeElement.isContentEditable) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents(); // Delete selected content
                range.insertNode(document.createTextNode(convertedText)); // Insert converted text
                selection.collapseToEnd(); // Adjust cursor position
            }
        } else {
            // If the selected text is not in an editable element,
            // we can try to replace it directly in the DOM, but it's less reliable
            // and often not what the user expects for non-input fields.
            // For context menu selections, info.selectionText is usually from an editable area.
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                // Ensure the selected text matches the text sent from background.js
                // This check helps prevent unintended replacements if selection changes rapidly.
                if (selection.toString() === message.text) {
                    range.deleteContents();
                    range.insertNode(document.createTextNode(convertedText));
                    selection.collapseToEnd();
                }
            }
        }
    } else if (message.type === "updateAutoCapitalizeSetting") {
        // Receive auto-capitalize setting update message
        autoCapitalizeEnabled = message.enabled;
        // console.log("Content script: Auto-capitalize setting updated:", autoCapitalizeEnabled);
    }
});

// Auto-capitalize enabled status (initial value is false)
let autoCapitalizeEnabled = false;

// Load initial settings
chrome.storage.sync.get('autoCapitalizeEnabled', (data) => {
    autoCapitalizeEnabled = data.autoCapitalizeEnabled || false;
    // console.log("Content script: Initial auto-capitalize setting loaded:", autoCapitalizeEnabled);
});


// Input event listener (for auto-capitalize sentence start)
document.addEventListener('input', (event) => {
    if (!autoCapitalizeEnabled) return; // Do not operate if feature is disabled

    const target = event.target;

    // Target only input, textarea, and contenteditable elements
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        let textBeforeCursor = '';
        let cursorPosition = 0;

        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            cursorPosition = target.selectionStart;
            textBeforeCursor = target.value.substring(0, cursorPosition);
        } else if (target.isContentEditable) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(target);
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                textBeforeCursor = preCaretRange.toString();
                cursorPosition = textBeforeCursor.length;
            }
        }

        // Check if the currently entered character is the start of a sentence
        // When a character is entered after a period, question mark, or exclamation mark followed by a space
        const sentenceEndRegex = /[.!?]\s*$/;
        const previousChar = textBeforeCursor.slice(-1); // Last character
        const charBeforePrevious = textBeforeCursor.slice(-2, -1); // Second to last character

        // If the current character is an alphabet and there's a sentence-ending punctuation + space before it
        if (textBeforeCursor.length > 1 && /[a-zA-Z]/.test(previousChar) && sentenceEndRegex.test(textBeforeCursor.slice(0, -1))) {
            // Convert the current character to uppercase
            let newChar = previousChar.toUpperCase();
            let newText = textBeforeCursor.slice(0, -1) + newChar;

            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                target.value = target.value.substring(0, cursorPosition - 1) + newChar + target.value.substring(cursorPosition);
                target.setSelectionRange(cursorPosition, cursorPosition); // Maintain cursor position
            } else if (target.isContentEditable) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.setStart(range.endContainer, range.endOffset - 1); // Select the last character
                    range.deleteContents(); // Delete the last character
                    range.insertNode(document.createTextNode(newChar)); // Insert uppercase character
                    selection.collapseToEnd(); // Maintain cursor position
                }
            }
        }
    }
}, true); // Execute event listener in the capturing phase to run before other scripts
