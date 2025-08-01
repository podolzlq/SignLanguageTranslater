# 수화 인식 모델 API 서버

한국어 수화 인식을 위한 TensorFlow Lite 모델과 Flask API 서버입니다.

## 🚀 주요 기능

- 실시간 수화 인식 (웹캠 기반)
- Flask REST API 서버
- React 프론트엔드 연동 지원
- MediaPipe Holistic을 이용한 손 랜드마크 추출
- TensorFlow Lite 모델을 이용한 실시간 추론

## 📁 프로젝트 구조

```
sign_language_model/
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

# 필요한 패키지 설치
pip install flask flask-cors tensorflow opencv-python mediapipe numpy
```

### 2. API 서버 실행
```bash
python api_server.py
```
서버가 `http://localhost:5000`에서 실행됩니다.

### 3. 웹캠 인식 실행
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

`react_example.js` 파일을 참고하여 React 앱에서 API를 호출할 수 있습니다.

### 사용 예시:
```javascript
import SignLanguageRecognition from './components/SignLanguageRecognition';

// 컴포넌트 사용
<SignLanguageRecognition />
```

## 🔧 기술 스택

- **Backend**: Flask, TensorFlow Lite
- **Computer Vision**: MediaPipe Holistic, OpenCV
- **Frontend**: React (예시 제공)
- **Data Processing**: NumPy, Pandas

## 📝 라이센스

이 프로젝트는 팀 프로젝트입니다.

## 👥 팀원

- AI 모델 개발 및 API 서버 구현
- React 프론트엔드 연동 지원 