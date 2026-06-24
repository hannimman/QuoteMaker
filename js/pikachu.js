// QuoteMaker - 피카츄 캔버스 애니메이션 (vanilla JS)
// 캔버스를 컨테이너 가로폭 전체로 맞춰 피카츄가 화면 전체를 가로질러 다닌다.

(() => {
    'use strict';

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const pikaLabel = document.querySelector('#lblPika');

    const PIKA_FALLBACK_URL =
        'https://raw.githubusercontent.com/jeanguyomarch/pikalogy/master/images/pika_01.png';
    const GROUND_RATIO = 80 / 150; // 캔버스 높이 대비 피카츄 바닥 위치 (풀밭 라인)
    const GROUND_STEP = 2;    // 뒤뚱거림 폭
    const JUMP_STEP = 3;      // 점프 이동 폭
    const JUMP_FRAMES = 17;   // 점프 상승 프레임 수
    const JUMP_PERIOD_MIN = 80;  // 점프 발동 주기 최소 프레임

    let groundY = 80; // 캔버스 크기에 맞춰 resizeCanvas 에서 갱신

    // [min, max] 정수 난수 (lodash _.random 대체)
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // ---- 배경 / 피카츄 이미지 ----
    const bg = new Image();
    bg.src = 'back.jpg';

    const pikaImg = new Image();
    loadPikaImage();

    function loadPikaImage() {
        // cross-origin 이미지를 blob 으로 받아 object URL 로 사용 (canvas 오염 방지)
        fetch(PIKA_FALLBACK_URL)
            .then(res => res.blob())
            .then(blob => { pikaImg.src = URL.createObjectURL(blob); })
            .catch(() => { pikaImg.src = PIKA_FALLBACK_URL; });
    }

    // ---- 캔버스 크기를 컨테이너에 맞춤 ----
    function resizeCanvas() {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        groundY = Math.round(canvas.height * GROUND_RATIO);
        // 점프 중이 아닌 피카츄는 새 바닥 위치로 맞춘다
        if (Array.isArray(pikas)) {
            pikas.forEach(p => { if (!p.isJumping) p.y = groundY; });
        }
    }

    // ---- 배경 스크롤 상태 ----
    // 같은 배경을 한 화면폭 간격으로 두 장 그려 이음새 없이 무한 스크롤한다.
    let bgX = 0;
    const BG_SPEED = 1;

    // ---- 피카츄 ----
    class Pikachu {
        constructor() {
            this.x = 0;
            this.y = groundY;
            this.width = 30;
            this.height = 30;
            this.speed = 1;
            this.dir = 1;             // 진행 방향: 1=왼→오른쪽, -1=오른→왼쪽
            this.angle = 0;
            this.lucky = false;       // 점프 중 회전 여부
            this.superLucky = false;  // 분신 생성 여부

            this.jumpPoint = JUMP_PERIOD_MIN;  // 점프 발동 주기
            this.jumpTimer = 0;
            this.jumpSwitch = false;  // 점프 예정
            this.isJumping = false;   // 점프 중
            this.hero = false;
            this.order = 0;   // 막둥이로 태어난 순서 (1부터, 일반 개체는 0)
            this.name = '조상님';
        }

        draw() {
            if (pikaImg.complete && pikaImg.naturalWidth) {
                if (this.dir === -1) {
                    // 왼쪽으로 걸을 땐 좌우 반전해 막둥이가 진행 방향을 바라보게 한다
                    ctx.save();
                    ctx.translate(this.x - this.width, this.y);
                    ctx.scale(-1, 1);
                    ctx.drawImage(pikaImg, -pikaImg.width, 0);
                    ctx.restore();
                } else {
                    ctx.drawImage(pikaImg, this.x - this.width, this.y);
                }
            }
            this.drawName(this.y - 3);
        }

        rotate() {
            this.angle += this.superLucky ? 1 : Math.PI / 18;
            ctx.save();
            ctx.translate(this.x - this.width, this.y);
            ctx.rotate(this.angle);
            if (pikaImg.complete && pikaImg.naturalWidth) {
                ctx.drawImage(pikaImg, -pikaImg.width / 2, -pikaImg.height / 2);
            }
            ctx.restore();
            this.drawName(this.y - 20);
        }

        drawName(textY) {
            if (this.name.length === 0) return;
            ctx.font = 'bold 13px 맑은고딕';
            // 스프라이트 가로 중심 위에 라벨을 가운데 정렬로 그린다
            const spriteW = (pikaImg.complete && pikaImg.naturalWidth) ? pikaImg.width : this.width;
            const centerX = this.x - this.width + spriteW / 2;
            ctx.textAlign = 'center';
            ctx.fillText(this.name, centerX, textY);
            ctx.textAlign = 'left'; // 기본값 복원
        }

        forward() {
            this.x += this.speed * this.dir;
        }

        // 점프 결심
        jumpingDecision() {
            if (this.isJumping) return;
            this.jumpSwitch = true;
            this.jumpPoint = rand(JUMP_PERIOD_MIN, 500);
            this.speed = rand(1, 4);
            this.lucky = rand(1, 10) % 2 === 0;
            this.superLucky = rand(1, 10) <= 3; // 막둥이 탄생 확률 30% (기존 10%의 3배)
            pikaLabel.innerText = '⚡'; // 백만볼트
        }

        update(timer) {
            // 화면 끝에 닿으면 반대편에서 다시 등장
            if (this.dir === 1 && this.x > canvas.width) {
                this.x = -this.width;
            } else if (this.dir === -1 && this.x < -this.width) {
                this.x = canvas.width + this.width;
            }

            if (timer % this.jumpPoint === 0) {
                this.jumpingDecision();
            }

            // 점프 상승
            if (this.jumpSwitch && this.y >= 10) {
                this.isJumping = true;
                this.y -= JUMP_STEP;
                this.jumpTimer++;
            }

            // 점프 하강 / 종료
            if (this.isJumping && this.jumpTimer >= JUMP_FRAMES) {
                this.jumpSwitch = false;
                if (this.y < groundY) {
                    this.y += JUMP_STEP;
                } else {
                    this.isJumping = false;
                    this.jumpTimer = 0;
                    pikaLabel.innerText = '';
                }
            }

            this.forward();

            // 평지에서 뒤뚱뒤뚱
            if (!this.jumpSwitch && !this.isJumping && timer % 10 === 1) {
                this.y += this.y <= groundY ? GROUND_STEP : -GROUND_STEP;
            }

            // 운 좋을 때만 회전 점프
            if (this.isJumping && this.lucky) {
                this.rotate();
            } else {
                this.draw();
            }
        }
    }

    // ---- 펑! 터지는 효과 ----
    class Burst {
        constructor(x, y) {
            this.particles = [];
            const count = 14;
            for (let i = 0; i < count; i++) {
                const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
                const sp = rand(2, 6);
                this.particles.push({
                    x, y,
                    vx: Math.cos(a) * sp,
                    vy: Math.sin(a) * sp,
                    r: rand(2, 5),
                });
            }
            this.maxLife = 30;
            this.life = this.maxLife;
        }

        update() {
            this.life--;
            const alpha = Math.max(this.life / this.maxLife, 0);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffd83b'; // 피카츄 노랑
            this.particles.forEach(pt => {
                pt.x += pt.vx;
                pt.y += pt.vy;
                pt.vy += 0.15; // 약한 중력
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        get dead() {
            return this.life <= 0;
        }
    }

    // 개체의 머리~몸 중심에서 펑 효과를 생성
    function spawnBurst(p) {
        const spriteW = (pikaImg.complete && pikaImg.naturalWidth) ? pikaImg.width : p.width;
        const spriteH = (pikaImg.complete && pikaImg.naturalHeight) ? pikaImg.height : p.height;
        const cx = p.x - p.width + spriteW / 2;
        const cy = p.y + spriteH / 2;
        bursts.push(new Burst(cx, cy));
    }

    let pikas = [new Pikachu()];
    const ancestor = pikas[0]; // 조상님: 리셋해도 사라지지 않는 최초 개체
    let timer = 0;
    let heroCount = 0; // 지금까지 태어난 막둥이 수 (라벨 번호용)
    const bursts = []; // 펑 효과(터지는 입자) 목록

    // 캔버스 크기 확정 후 바닥 위치 계산 (pikas 선언 이후 호출)
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 리셋 버튼 등 외부에서 점프 신호를 줄 수 있도록 노출
    window.pikaJump = () => pikas.forEach(p => p.jumpingDecision());

    // 리셋: 조상님만 남기고 나머지는 펑 터뜨려 제거
    window.pikaReset = () => {
        for (let i = pikas.length - 1; i >= 0; i--) {
            if (pikas[i] === ancestor) continue;
            spawnBurst(pikas[i]);
            pikas.splice(i, 1);
        }
        heroCount = 0; // 다음에 태어나는 막둥이는 다시 1번부터
    };

    function animate() {
        requestAnimationFrame(animate);
        timer++;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 같은 배경을 한 화면폭 간격으로 두 장 그려 이음새 없이 스크롤
        bgX -= BG_SPEED;
        if (bgX <= -canvas.width) bgX = 0;
        ctx.drawImage(bg, bgX, 0, canvas.width, canvas.height);
        ctx.drawImage(bg, bgX + canvas.width, 0, canvas.width, canvas.height);

        // superLucky 피카츄가 있으면 분신(막둥이) 추가
        const last = pikas[pikas.length - 1];
        if (last.superLucky) {
            const hero = new Pikachu();
            hero.hero = true;
            heroCount++;
            hero.order = heroCount;   // 태어난 순서 (1부터)
            hero.name = '막둥이';      // 가장 마지막에 태어난 개체가 막둥이
            // 직전 막둥이는 자기 태어난 순서 번호로 라벨 교체 (조상님은 그대로 둔다)
            if (last.hero) {
                last.name = String(last.order);
            }
            last.hero = false;
            // 막둥이는 정방향/역방향 중 랜덤으로 태어난다
            hero.dir = rand(0, 1) === 0 ? 1 : -1;
            if (hero.dir === -1) {
                hero.x = canvas.width + hero.width;  // 역방향이면 오른쪽 끝에서 등장
            }
            pikas.push(hero);
        }

        pikas.forEach(pika => pika.update(timer));

        // 펑 효과 갱신 (수명이 다한 것은 제거)
        for (let i = bursts.length - 1; i >= 0; i--) {
            bursts[i].update();
            if (bursts[i].dead) bursts.splice(i, 1);
        }
    }

    animate();
})();
