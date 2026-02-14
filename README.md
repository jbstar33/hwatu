# Hwatu Matgo (사람 vs AI)

HTML5/CSS/JavaScript로 만든 2인 맞고(사람 vs AI) 프로젝트입니다.  
실제 화투 시트 이미지를 분할한 카드 자산을 사용합니다.

## 주요 기능
- 사람 vs AI 턴 기반 플레이
- 맞고 점수/고·스톱 흐름
- 카드 내기/뒤집기 애니메이션
- 음성 안내(브라우저 TTS 기반)
- 실제 화투 시트 기반 48장 이미지 + 보너스피 2장

## 폴더 구조
- `index.html`: 메인 화면
- `styles.css`: UI 스타일
- `game.js`: 게임 로직
- `rules.html`: 규칙 보기 페이지
- `scripts/build_hwatu_assets.py`: 화투 시트 분할 스크립트
- `scripts/hwatu_sheet.png`: 원본 화투 시트
- `assets/hwatu/`: 생성된 카드 PNG 자산

## 실행 방법
정적 파일이라 브라우저에서 바로 열어도 동작하지만, 로컬 서버 실행을 권장합니다.

```bash
cd "/Users/jbstar33/git_root/simple game"
python3 -m http.server 8000
```

브라우저에서:

`http://localhost:8000`

## 화투 이미지 재생성
원본 시트(`scripts/hwatu_sheet.png`)를 기준으로 48장을 다시 생성할 때:

```bash
python3 scripts/build_hwatu_assets.py
```

생성 결과:
- `assets/hwatu/m01_0.png` ~ `assets/hwatu/m12_3.png` (48장)
- `assets/hwatu/bonus_1.png`, `assets/hwatu/bonus_2.png`

## Git 업로드 제외
`.gitignore`에 아래 항목이 제외되도록 설정되어 있습니다.
- `ref/`
- `SESSION_MEMORY.md`
- `.DS_Store`

## 참고
- 보너스 카드 이미지는 현재 황금 돼지 테마입니다.
- 음성은 브라우저/OS에 설치된 TTS 음성 품질에 따라 다르게 들릴 수 있습니다.

