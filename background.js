// background.js

// 콘텍스트 메뉴를 생성하는 함수.
// 이 함수는 확장 프로그램이 설치되거나 업데이트될 때 한 번만 실행됩니다.
function createContextMenus() {
    // 기존 콘텍스트 메뉴를 모두 제거하여 중복 생성을 방지합니다.
    chrome.contextMenus.removeAll(() => {
        // '대소문자 변환'이라는 최상위 부모 메뉴를 생성합니다.
        // 이 메뉴는 사용자가 텍스트를 선택했을 때만 나타납니다.
        chrome.contextMenus.create({
            id: "caseConverterParent",
            title: "대소문자 변환",
            contexts: ["selection"]
        });

        // 부모 메뉴의 하위 메뉴들을 생성합니다.
        chrome.contextMenus.create({
            id: "uppercase",
            parentId: "caseConverterParent",
            title: "모두 대문자로",
            contexts: ["selection"]
        });
        chrome.contextMenus.create({
            id: "lowercase",
            parentId: "caseConverterParent",
            title: "모두 소문자로",
            contexts: ["selection"]
        });
        chrome.contextMenus.create({
            id: "titlecase",
            parentId: "caseConverterParent",
            title: "각 단어 첫 글자 대문자로",
            contexts: ["selection"]
        });
        chrome.contextMenus.create({
            id: "sentencecase",
            parentId: "caseConverterParent",
            title: "문장 첫 글자 대문자로",
            contexts: ["selection"]
        });
        chrome.contextMenus.create({
            id: "togglecase",
            parentId: "caseConverterParent",
            title: "대소문자 반전",
            contexts: ["selection"]
        });
    });
}

// 확장 프로그램이 설치되거나 업데이트될 때 콘텍스트 메뉴를 생성합니다.
chrome.runtime.onInstalled.addListener(() => {
    createContextMenus();
});

// 콘텍스트 메뉴가 클릭되었을 때 실행되는 리스너입니다.
// 이 리스너는 `contextMenus` 권한을 사용합니다.
chrome.contextMenus.onClicked.addListener((info, tab) => {
    // 클릭된 메뉴가 우리의 부모 메뉴('caseConverterParent') 아래에 있는지 확인합니다.
    if (info.parentMenuItemId === "caseConverterParent") {
        const conversionType = info.menuItemId;
        const selectedText = info.selectionText;

        // `chrome.scripting.executeScript`를 사용하여 웹페이지에 스크립트를 주입합니다.
        // 이 호출은 `scripting` 권한과 `activeTab` 권한을 명시적으로 사용합니다.
        // `target` 속성은 스크립트가 실행될 탭을 지정합니다.
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            // `func`는 주입될 함수입니다. 이 함수는 `content.js`의 컨텍스트에서 실행됩니다.
            func: (text, type) => {
                // 이 함수는 `content.js`의 컨텍스트에서 실행됩니다.
                // 텍스트 변환 로직을 여기서 직접 실행하여 `scripting` 권한 사용을 명확히 합니다.

                // 텍스트 변환 함수들을 내부에서 정의합니다.
                const toUppercase = (t) => t.toUpperCase();
                const toLowercase = (t) => t.toLowerCase();
                const toTitleCase = (t) => t.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                const toSentenceCase = (t) => t.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
                const toToggleCase = (t) => t.split('').map((char) => (char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase())).join('');

                // 변환 유형에 따라 적절한 함수를 선택합니다.
                const converter = {
                    "uppercase": toUppercase,
                    "lowercase": toLowercase,
                    "titlecase": toTitleCase,
                    "sentencecase": toSentenceCase,
                    "togglecase": toToggleCase
                };

                const convertedText = converter[type](text);

                // 웹페이지의 선택된 텍스트를 변환된 텍스트로 교체합니다.
                // 이 부분이 `activeTab` 권한이 필요한 핵심 작업입니다.
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                    const start = activeElement.selectionStart;
                    const end = activeElement.selectionEnd;
                    activeElement.value = activeElement.value.substring(0, start) + convertedText + activeElement.value.substring(end);
                } else if (window.getSelection) {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(document.createTextNode(convertedText));
                    }
                }
            },
            // `args`는 위 함수에 전달될 인자들입니다.
            args: [selectedText, conversionType]
        });
    }
});

// 팝업 또는 다른 스크립트로부터 메시지를 수신하여 '자동 대문자' 설정을 업데이트합니다.
// 이 기능은 `scripting` 권한과 별개로 `storage` 및 메시징 API를 사용합니다.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "autoCapitalizeSettingChange") {
        // 모든 탭에 메시지를 보내 content.js의 설정을 업데이트합니다.
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    type: "updateAutoCapitalizeSetting",
                    enabled: message.enabled
                }).catch(error => {
                    if (error.message.includes("Could not establish connection. Receiving end does not exist.")) {
                        // content.js가 아직 로드되지 않은 탭에서는 정상적인 오류이므로 무시합니다.
                    } else {
                        console.error("Error sending message:", error);
                    }
                });
            });
        });
    }
});
