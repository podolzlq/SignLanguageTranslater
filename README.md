# 수화 인식 시스템

한국어 수화 인식을 위한 React 프론트엔드와 Flask API 서버입니다.

## 🚀 주요 기능

- 실시간 수화 인식 (웹캠 기반)
- React 프론트엔드 UI
- Flask REST API 서버
- MediaPipe Holistic을 이용한 손 랜드마크 추출
- TensorFlow Lite 모델을 이용한 실시간 추론

## 📁 프로젝트 구조

```
sign_language_model/
├── src/                       # React 프론트엔드
│   ├── pages/
│   │   ├── Splash.jsx         # 스플래시 페이지
│   │   ├── Home.jsx           # 홈 페이지
│   │   └── Translator.jsx     # 수화 인식 페이지
│   └── components/            # React 컴포넌트들
├── api_server.py              # Flask API 서버
├── webcam_word_sign_recognition.py  # 웹캠 인식 스크립트
├── react_example.js           # React 컴포넌트 예시
├── sing_lang_trans/           # MediaPipe 모듈
│   └── modules/
│       ├── holistic_module.py
│       └── utils.py
├── models/                    # 모델 파일들
├── processed_data/            # 전처리된 데이터
└── README.md
```

## 🛠️ 설치 및 실행

### 1. 환경 설정
```bash
# 가상환경 활성화
venv_py310\Scripts\activate  # Windows
source venv_py310/bin/activate  # Linux/Mac

# Python 패키지 설치
pip install flask flask-cors tensorflow opencv-python mediapipe numpy

# React 패키지 설치
npm install
```

### 2. API 서버 실행
```bash
python api_server.py
```
서버가 `http://localhost:5000`에서 실행됩니다.

### 3. React 앱 실행
```bash
npm start
```
React 앱이 `http://localhost:3000`에서 실행됩니다.

### 4. 웹캠 인식 실행 (독립 실행)
```bash
python webcam_word_sign_recognition.py
```

## 🔌 API 엔드포인트

### 서버 상태 확인
```http
GET /api/health
```

### 수화 인식
```http
POST /api/predict
Content-Type: application/json

{
  "image": "base64_encoded_image_string"
}
```

### 인식 가능한 문자 목록
```http
GET /api/characters
```

### 모델 정보
```http
GET /api/model-info
```

## 📱 React 연동

`src/pages/Translator.jsx`에서 API 서버와 연동하여 실시간 수화 인식을 수행합니다.

### 주요 기능:
- 웹캠 실시간 스트리밍
- MediaPipe 손 랜드마크 추출
- API 서버를 통한 수화 인식
- 인식 결과 실시간 표시

## 🔧 기술 스택

- **Frontend**: React, React Router, React Webcam
- **Backend**: Flask, TensorFlow Lite
- **Computer Vision**: MediaPipe Holistic, OpenCV
- **Data Processing**: NumPy, Pandas

## 📝 라이센스

이 프로젝트는 팀 프로젝트입니다.

## 👥 팀원

- React 프론트엔드 개발
- AI 모델 개발 및 API 서버 구현
