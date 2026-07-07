# old/ — 수정 전 원본 백업 & 원복 방법

이 폴더는 "피카츄 비 효과 + 이동 배너" 개편 **직전** 파일들의 백업입니다.
아래 방법 중 하나로 원래(따옴표 변환기 + 걷는 피카츄) 상태로 되돌릴 수 있습니다.

## 백업에 들어있는 파일
- `old/index.html`      → 원본 `index.html`
- `old/css/styles.css`  → 원본 `css/styles.css`
- `old/js/pikachu.js`   → 원본 `js/pikachu.js`
- `old/js/quote.js`     → 원본 `js/quote.js`

> ⚠️ `js/rain.js`(비 효과)는 개편 때 새로 만든 파일이라 백업에 없습니다.
> 원복 시 **삭제**해야 합니다.

---

## 방법 1) 백업 파일 통째로 덮어쓰기 (가장 확실)

프로젝트 루트(`QuoteMaker`)에서 PowerShell로 실행:

```powershell
Copy-Item old\index.html      index.html            -Force
Copy-Item old\css\styles.css  css\styles.css        -Force
Copy-Item old\js\pikachu.js   js\pikachu.js         -Force
Copy-Item old\js\quote.js     js\quote.js           -Force
Remove-Item js\rain.js -Force   # 비 효과 파일 제거
```

그런 다음 배포:

```powershell
git add -A
git commit -m "revert: 피카츄 비 효과 개편 원복"
git push origin main
```

---

## 방법 2) 손으로 3군데만 되돌리기 (백업 파일 없이)

개편은 아래 3가지 변경이 전부입니다. 반대로만 하면 됩니다.

1. **`index.html`**
   - `<!-- 중앙 이동 배너 ... -->` 로 시작하는 `<style>` + `<a id="pikaBanner">` 블록 **삭제**
   - `<!-- <script src="js/quote.js"></script> -->` 주석을 풀어 **다시 활성화**
   - `<script src="js/rain.js"></script>` 줄과 그 위 주석 **삭제**

2. **`js/pikachu.js`**
   - 파일 맨 끝 `// animate();` 의 주석을 풀어 `animate();` 로 되돌리기
     (걷는 피카츄 애니메이션 다시 시작)

3. **`js/rain.js`** 파일 **삭제**

그런 다음 방법 1과 동일하게 `git add -A → commit → push`.

---

## 방법 3) 특정 커밋으로 되돌리기 (git)

개편 직전 커밋은 `b8b9a51` 입니다. 그 시점 파일로 되돌리려면:

```powershell
git checkout b8b9a51 -- index.html css js   # rain.js 는 그 커밋에 없으므로 함께 사라짐
git add -A
git commit -m "revert: 피카츄 비 효과 개편 원복"
git push origin main
```
