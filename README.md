# 🤟 한국 수어 인식 시스템

한국 수어(자음/모음)를 실시간으로 인식하는 AI 시스템입니다. MediaPipe와 TensorFlow Lite를 사용하여 웹캠을 통해 실시간 수어 인식을 수행합니다.

## 🚀 주요 기능

- **실시간 수어 인식**: 웹캠을 통한 실시간 한국 수어 인식
- **31개 자음/모음 지원**: ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅅ, ㅇ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ, ㅏ, ㅑ, ㅓ, ㅕ, ㅗ, ㅛ, ㅜ, ㅠ, ㅡ, ㅣ, ㅐ, ㅒ, ㅔ, ㅖ, ㅢ, ㅚ, ㅟ
- **웹 인터페이스**: 아름다운 웹 페이지에서 실시간 결과 확인
- **신뢰도 표시**: 예측 결과의 신뢰도를 시각적으로 표시
- **상위 3개 예측**: 가장 가능성 높은 3개 결과를 동시에 표시

## 📁 프로젝트 구조

```
sign_language_model/
├── models/
│   └── multi_hand_gesture_classifier.tflite  # 학습된 모델
├── sing_lang_trans/
│   ├── modules/
│   │   ├── holistic_module.py               # MediaPipe 홀리스틱 모듈
│   │   └── utils.py                         # 유틸리티 함수
│   ├── templates/
│   │   └── index.html                       # 웹 인터페이스
│   ├── simple_test.py                       # 콘솔 기반 테스트
│   └── web_app.py                           # 웹 서버
├── processed_data/
│   └── label_mapping.json                   # 라벨 매핑
└── README.md
```

## 🛠️ 설치 방법

### 1. 저장소 클론
```bash
git clone [your-repository-url]
cd sign_language_model
```

### 2. Python 가상환경 생성 및 활성화

**Windows:**
```bash
python -m venv venv_py310
venv_py310\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv_py310
source venv_py310/bin/activate
```

### 3. 필요한 패키지 설치
```bash
pip install -r requirements.txt
```

만약 `requirements.txt` 파일이 없다면 다음 명령어로 직접 설치:
```bash
pip install opencv-python mediapipe tensorflow numpy flask flask-socketio
```

## 🚀 실행 방법

### 방법 1: 웹 인터페이스 (권장)

1. **웹 서버 실행:**
```bash
cd sing_lang_trans
python web_app.py
```

2. **브라우저에서 접속:**
   - 브라우저를 열고 `http://localhost:5000` 접속
   - "인식 시작" 버튼 클릭
   - 웹캠 권한 허용
   - 실시간 수어 인식 결과 확인

### 방법 2: 콘솔 기반 테스트

```bash
cd sing_lang_trans
python simple_test.py
```

- ESC 키를 눌러 종료
- 터미널에서 예측 결과 확인

## 📖 사용법

### 웹 인터페이스 사용법

1. **연결 확인**: 페이지 로드 시 "서버에 연결되었습니다!" 메시지 확인
2. **인식 시작**: "인식 시작" 버튼 클릭
3. **수어 표시**: 웹캠 앞에서 한국 수어 자음/모음 표시
4. **결과 확인**: 
   - 메인 예측 결과: 가장 큰 글씨로 표시
   - 신뢰도 바: 예측 신뢰도를 시각적으로 표시
   - 상위 3개 예측: 가능성 높은 3개 결과 표시
5. **인식 중지**: "인식 중지" 버튼 클릭

### 지원하는 수어

**자음 (14개):**
- ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅅ, ㅇ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ

**모음 (17개):**
- ㅏ, ㅑ, ㅓ, ㅕ, ㅗ, ㅛ, ㅜ, ㅠ, ㅡ, ㅣ
- ㅐ, ㅒ, ㅔ, ㅖ, ㅢ, ㅚ, ㅟ

## 🔧 기술 스택

- **Python 3.10+**: 메인 프로그래밍 언어
- **OpenCV**: 컴퓨터 비전 및 웹캠 처리
- **MediaPipe**: 손 랜드마크 추출
- **TensorFlow Lite**: 경량화된 딥러닝 모델
- **Flask**: 웹 서버 프레임워크
- **Socket.IO**: 실시간 웹소켓 통신
- **HTML/CSS/JavaScript**: 웹 인터페이스

## 🐛 문제 해결

### 1. 웹캠이 열리지 않는 경우
- 다른 프로그램에서 웹캠을 사용 중인지 확인
- 웹캠 권한을 허용했는지 확인
- 웹캠 드라이버가 정상적으로 설치되었는지 확인

### 2. 모델 파일을 찾을 수 없는 경우
```bash
# models 폴더가 있는지 확인
ls models/
# multi_hand_gesture_classifier.tflite 파일이 있는지 확인
```

### 3. 패키지 설치 오류
```bash
# 가상환경이 활성화되어 있는지 확인
# Windows
venv_py310\Scripts\activate

# macOS/Linux
source venv_py310/bin/activate

# 패키지 재설치
pip install --upgrade pip
pip install opencv-python mediapipe tensorflow numpy flask flask-socketio
```

### 4. 포트 충돌
- 5000번 포트가 사용 중인 경우 다른 포트 사용:
```python
# web_app.py 파일에서 포트 변경
socketio.run(app, host='0.0.0.0', port=5001, debug=True)
```

## 📝 요구사항

- **Python**: 3.10 이상
- **웹캠**: USB 웹캠 또는 내장 웹캠
- **메모리**: 최소 4GB RAM
- **저장공간**: 최소 1GB 여유 공간

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

**참고**: 이 시스템은 교육 및 연구 목적으로 개발되었습니다. 실제 수어 통역에는 전문적인 검증이 필요합니다.
