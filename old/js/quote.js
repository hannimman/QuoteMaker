// QuoteMaker - 따옴표/콤마 변환 & 쿼리 생성 로직 (vanilla JS)

(() => {
    'use strict';

    // ---- DOM 참조 ----
    const origin = document.querySelector('#taOrigin');     // INPUT
    const newOutput = document.querySelector('#taNew');     // OUTPUT
    const newCustom = document.querySelector('#taCus');     // CUSTOM
    const splitRadios = document.querySelectorAll('input[name="group"]');   // 구분자(엔터/콤마)
    const caseRadios = document.querySelectorAll('input[name="group2"]');   // 대/소문자
    const quoteRadios = document.querySelectorAll('input[name="quoteGroup"]'); // 따옴표 종류
    const enterRadio = document.querySelector('#enter');
    const upperRadio = document.querySelector('#username');
    const commaCheck = document.querySelector('#commaCheck');
    const resetButton = document.querySelector('#resetButton');
    const outputCount = document.querySelector('#pCount');

    // ---- 상태 ----
    let quoteChar = "'";   // 현재 따옴표 문자
    let withComma = true;  // 줄 앞 콤마 포함 여부

    const DIGIT_EMOJI = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

    // ---- 이벤트 바인딩 ----
    origin.addEventListener('input', () => changeQuote(origin.value));

    resetButton.addEventListener('click', () => {
        deleteAll();
        // 조상님만 남기고 나머지 개체를 펑 터뜨려 제거 (pikachu.js 가 노출)
        if (typeof window.pikaReset === 'function') {
            window.pikaReset();
        }
    });

    splitRadios.forEach(r => r.addEventListener('change', () => changeQuote(origin.value)));
    caseRadios.forEach(r => r.addEventListener('change', () => customQuery(newOutput.value)));

    quoteRadios.forEach(r => r.addEventListener('change', () => {
        if (quoteRadios[0].checked) quoteChar = "'";
        else if (quoteRadios[1].checked) quoteChar = '"';
        else quoteChar = '';
        changeQuote(origin.value);
    }));

    commaCheck.addEventListener('change', () => {
        withComma = commaCheck.checked;
        changeQuote(origin.value);
    });

    document.addEventListener('DOMContentLoaded', () => {
        setupClipboardCopy('copyOutputButton', 'taNew');
        setupClipboardCopy('copyCustomButton', 'taCus');
    });

    // 초기 플레이스홀더
    updatePlaceholder();

    // ---- 핵심 로직 ----

    function updatePlaceholder() {
        origin.placeholder = enterRadio.checked
            ? '엔터(New line)를 구분자로 값을 분리합니다\r\n\nvalue1\r\nvalue2\r\nvalue3\r\n....\r\n...\r\n..\r\n.'
            : '콤마를 구분자로 값을 분리합니다\r\n\n👉 value1, value2, value3...';
    }

    // 입력값에 따옴표/콤마를 적용해 OUTPUT 생성
    function changeQuote(val) {
        updatePlaceholder();

        if (!val) {
            deleteAll();
            return;
        }

        const useNewline = enterRadio.checked;
        let str = val.replace(/ /g, '');
        if (!useNewline) {
            str = str.replace(/(?:\r\n|\r|\n)/g, '');
        }

        const splitter = useNewline ? '\n' : ',';
        const items = str.split(splitter).filter(Boolean);

        // 각 항목을 따옴표로 감싸고, join(',') 로 줄 앞 콤마(SQL IN 리스트 형태)를 만든다
        const quoted = items.map(x => `${quoteChar}${x}${quoteChar}\n`);
        let result = quoted.join(',').replace(/\s+$/, ''); // 마지막 개행 제거
        if (!withComma) {
            result = result.replace(/,/g, '');
        }
        newOutput.value = result;

        outputCount.innerText = '💁‍♀️' + beCool(items.length);
        customQuery(newOutput.value);
    }

    // OUTPUT 을 대/소문자로 변환해 CUSTOM 생성
    function customQuery(val) {
        if (!val) return;

        const lines = val.split('\n');
        const cleaned = lines.map(line => line.replace(',', '') + '\n'); // 줄 앞 콤마 제거
        let result = cleaned.join(',').replace(/\s+$/, '');
        result = upperRadio.checked ? result.toUpperCase() : result.toLowerCase();
        if (!withComma) {
            result = result.replace(/,/g, '');
        }
        newCustom.value = result;
    }

    // 숫자를 이모지로 (개수 표시용)
    function beCool(value) {
        if (value === undefined || value === null || value === '') {
            return value;
        }
        const s = String(value);
        if (s === '10') return '🔟';
        return s.replace(/\d/g, d => DIGIT_EMOJI[d]);
    }

    function deleteAll() {
        origin.value = '';
        newOutput.value = '';
        newCustom.value = '';
        outputCount.innerText = '';
    }

    // 클립보드 복사 + 버튼 피드백
    function setupClipboardCopy(buttonId, textareaId) {
        const button = document.getElementById(buttonId);
        const textElement = document.getElementById(textareaId);

        if (!button || !textElement) {
            console.warn(`클립보드 요소를 찾을 수 없습니다: ${buttonId} 또는 ${textareaId}`);
            return;
        }

        const originalText = button.textContent;
        const originalClasses = [...button.classList];

        const restore = () => {
            button.textContent = originalText;
            button.className = originalClasses.join(' ');
        };

        const flash = (label, classes) => {
            button.textContent = label;
            // 원래 색 계열만 제거하고 임시 색 적용
            originalClasses.forEach(cls => {
                if (cls.startsWith('bg-') || cls.startsWith('hover:bg-')) {
                    button.classList.remove(cls);
                }
            });
            button.classList.add(...classes);
            setTimeout(restore, 1000);
        };

        button.addEventListener('click', async () => {
            const text = textElement.value;
            if (!text) {
                flash('Empty!', ['bg-yellow-500', 'hover:bg-yellow-600']);
                return;
            }
            try {
                await navigator.clipboard.writeText(text);
                flash('Copied!', ['bg-green-500', 'hover:bg-green-600']);
            } catch (err) {
                console.error('클립보드 복사 실패:', err);
                flash('Failed!', ['bg-red-500', 'hover:bg-red-600']);
            }
        });
    }
})();
