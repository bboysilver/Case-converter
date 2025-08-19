// 이 스크립트는 `manifest.json`에 의해 모든 페이지에 주입됩니다.
// 실시간 자동 대문자 기능과 팝업 메시지 수신을 담당합니다.

let isAutoCapitalizeEnabled = false;

// 자동 대문자 설정 상태를 업데이트하는 메시지 리스너
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "updateAutoCapitalizeSetting") {
        isAutoCapitalizeEnabled = message.enabled;
        console.log("Auto-capitalize setting updated:", isAutoCapitalizeEnabled);
    }
});

// 자동 대문자 기능 (베타): 문장의 시작을 자동으로 대문자로 변환합니다.
document.addEventListener('input', (event) => {
    if (!isAutoCapitalizeEnabled) {
        return;
    }

    const target = event.target;
    // input, textarea, 그리고 contenteditable 요소에만 적용
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        const cursorPosition = target.selectionStart || window.getSelection().anchorOffset;
        // 커서 위치 바로 앞의 텍스트
        const textBeforeCursor = target.value ? target.value.substring(0, cursorPosition) : window.getSelection().anchorNode.textContent.substring(0, cursorPosition);

        // 문장 끝을 나타내는 정규식: 마침표, 물음표, 느낌표 뒤에 공백이 오는 경우
        const sentenceEndRegex = /[.!?]\s*$/;
        const previousChar = textBeforeCursor.slice(-1); // 마지막 글자

        // 현재 입력된 글자가 알파벳이고, 그 앞에 문장 끝 부호 + 공백이 있는 경우
        if (textBeforeCursor.length > 1 && /[a-zA-Z]/.test(previousChar) && sentenceEndRegex.test(textBeforeCursor.slice(0, -1))) {
            // 현재 입력된 글자를 대문자로 변환
            let newChar = previousChar.toUpperCase();

            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                target.value = target.value.substring(0, cursorPosition - 1) + newChar + target.value.substring(cursorPosition);
                target.setSelectionRange(cursorPosition, cursorPosition); // 커서 위치 유지
            } else if (target.isContentEditable) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.setStart(range.endContainer, range.endOffset - 1); // 마지막 글자 선택
                    range.deleteContents(); // 마지막 글자 삭제
                    range.insertNode(document.createTextNode(newChar)); // 대문자 삽입
                    selection.collapseToEnd(); // 커서 위치 유지
                }
            }
        }
    }
}, true); // 이벤트 리스너를 캡처링 단계에서 실행하여 다른 스크립트보다 먼저 실행되도록 합니다.
