// QuoteMaker - 피카츄 비(rain) 효과 (전체 화면 오버레이)
// 되돌리려면 index.html 에서 이 스크립트 태그만 제거하고 pikachu.js 의 animate() 주석을 풀면 된다.

(() => {
    'use strict';

    const PIKA_URL =
        'https://raw.githubusercontent.com/jeanguyomarch/pikalogy/master/images/pika_01.png';

    const img = new Image();
    img.src = PIKA_URL; // 픽셀을 읽지 않으므로 crossOrigin 불필요

    // 화면 전체를 덮는 오버레이 캔버스 (UI 클릭 막지 않도록 pointer-events:none)
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
        position: 'fixed', top: '0', left: '0',
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: '9999',
    });
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const rand = (min, max) => Math.random() * (max - min) + min;

    let drops = [];
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const count = Math.round(canvas.width / 24); // 화면폭에 비례한 방울 수
        drops = Array.from({ length: count }, spawn);
    }

    // 위쪽 화면 밖에서 시작해 아래로 떨어지는 방울 하나
    function spawn() {
        const size = rand(20, 46);
        return {
            x: rand(0, window.innerWidth),
            y: rand(-window.innerHeight, 0),
            size,
            speed: rand(1.5, 4) * (size / 30), // 큰 놈이 조금 빠르게
            swayAmp: rand(6, 22),
            swayPhase: rand(0, Math.PI * 2),
            swaySpeed: rand(0.01, 0.03),
        };
    }

    resize();
    window.addEventListener('resize', resize);

    function tick() {
        requestAnimationFrame(tick);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!(img.complete && img.naturalWidth)) return;

        for (const d of drops) {
            d.y += d.speed;
            d.swayPhase += d.swaySpeed;
            const x = d.x + Math.sin(d.swayPhase) * d.swayAmp;
            ctx.drawImage(img, x, d.y, d.size, d.size);
            if (d.y > canvas.height) { // 바닥에 닿으면 위에서 재등장
                d.y = -d.size;
                d.x = rand(0, canvas.width);
            }
        }
    }

    tick();
})();
