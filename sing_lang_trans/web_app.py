from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO, emit
import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
import modules.holistic_module as hm
from modules.utils import Vector_Normalization
import threading
import time
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# 설정
actions = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
           'ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ',
           'ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅢ', 'ㅚ', 'ㅟ']
seq_length = 10

# 영문 매핑 정의
action_eng = {
    'ㄱ': 'GIYEOK', 'ㄴ': 'NIEUN', 'ㄷ': 'DIGEUT', 'ㄹ': 'RIEUL', 'ㅁ': 'MIEUM',
    'ㅂ': 'BIEUP', 'ㅅ': 'SIOT', 'ㅇ': 'IEUNG', 'ㅈ': 'JIEUT', 'ㅊ': 'CHIEUT',
    'ㅋ': 'KIEUK', 'ㅌ': 'TIEUT', 'ㅍ': 'PIEUP', 'ㅎ': 'HIEUT',
    'ㅏ': 'A', 'ㅑ': 'YA', 'ㅓ': 'EO', 'ㅕ': 'YEO', 'ㅗ': 'O', 'ㅛ': 'YO',
    'ㅜ': 'U', 'ㅠ': 'YU', 'ㅡ': 'EU', 'ㅣ': 'I',
    'ㅐ': 'AE', 'ㅒ': 'YAE', 'ㅔ': 'E', 'ㅖ': 'YE', 'ㅢ': 'UI', 'ㅚ': 'OE', 'ㅟ': 'WI'
}

# 전역 변수
detector = None
interpreter = None
is_running = False
current_prediction = None

def initialize_detector_and_model():
    """MediaPipe 홀리스틱 모델과 TFLite 모델 초기화"""
    global detector, interpreter
    detector = hm.HolisticDetector(min_detection_confidence=0.3)
    interpreter = tf.lite.Interpreter(model_path="../models/multi_hand_gesture_classifier.tflite")
    interpreter.allocate_tensors()
    print("모델 초기화 완료!")

def process_hand_landmarks(right_hand_lmList):
    """손 랜드마크 처리 및 벡터 정규화"""
    joint = np.zeros((42, 2))
    for j, lm in enumerate(right_hand_lmList.landmark):
        joint[j] = [lm.x, lm.y]
    vector, angle_label = Vector_Normalization(joint)
    return np.concatenate([vector.flatten(), angle_label.flatten()])

def predict_action(interpreter, input_data):
    """TFLite 모델을 사용하여 동작 예측"""
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    interpreter.set_tensor(input_details[0]['index'], input_data)
    interpreter.invoke()
    y_pred = interpreter.get_tensor(output_details[0]['index'])
    return y_pred[0]

def sign_language_detection():
    """실시간 수어 인식 스레드"""
    global is_running, current_prediction
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("웹캠을 열 수 없습니다!")
        return
    
    print("웹캠 연결 성공!")
    
    seq = []
    frame_count = 0
    
    while is_running:
        ret, img = cap.read()
        if not ret:
            break
        
        # 이미지 좌우 반전 (거울 효과)
        img = cv2.flip(img, 1)
        
        # MediaPipe 홀리스틱 처리
        img = detector.findHolistic(img, draw=True)
        _, right_hand_lmList = detector.findRighthandLandmark(img)
        
        if right_hand_lmList is not None:
            # 손 랜드마크 처리
            d = process_hand_landmarks(right_hand_lmList)
            seq.append(d)
            frame_count += 1
            
            # 시퀀스 길이 확인
            if len(seq) >= seq_length:
                # 입력 데이터 준비
                input_data = np.expand_dims(np.array(seq[-seq_length:], dtype=np.float32), axis=0)
                
                # 예측
                y_pred = predict_action(interpreter, input_data)
                i_pred = int(np.argmax(y_pred))
                conf = y_pred[i_pred]
                
                predicted_action = actions[i_pred]
                
                # 상위 3개 예측 결과
                top_indices = np.argsort(y_pred)[-3:][::-1]
                top_predictions = []
                for i, idx in enumerate(top_indices):
                    top_predictions.append({
                        'rank': i + 1,
                        'action': actions[idx],
                        'action_eng': action_eng.get(actions[idx], actions[idx]),
                        'confidence': float(y_pred[idx])
                    })
                
                # 현재 예측 결과 업데이트
                current_prediction = {
                    'predicted_action': predicted_action,
                    'predicted_action_eng': action_eng.get(predicted_action, predicted_action),
                    'confidence': float(conf),
                    'top_predictions': top_predictions,
                    'frame_count': frame_count,
                    'timestamp': time.time()
                }
                
                # WebSocket을 통해 클라이언트에 결과 전송
                socketio.emit('prediction_result', current_prediction)
                
                print(f"예측: {predicted_action} ({action_eng.get(predicted_action, predicted_action)}), 신뢰도: {conf:.3f}")
        
        time.sleep(0.1)  # CPU 사용량 조절
    
    cap.release()
    print("수어 인식 스레드 종료")

@app.route('/')
def index():
    """메인 페이지"""
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    """클라이언트 연결 시"""
    print('클라이언트가 연결되었습니다.')
    emit('status', {'message': '연결되었습니다!'})

@socketio.on('start_detection')
def handle_start_detection():
    """수어 인식 시작"""
    global is_running
    if not is_running:
        is_running = True
        thread = threading.Thread(target=sign_language_detection)
        thread.daemon = True
        thread.start()
        emit('status', {'message': '수어 인식이 시작되었습니다!'})
    else:
        emit('status', {'message': '이미 실행 중입니다!'})

@socketio.on('stop_detection')
def handle_stop_detection():
    """수어 인식 중지"""
    global is_running
    is_running = False
    emit('status', {'message': '수어 인식이 중지되었습니다!'})

@socketio.on('get_current_prediction')
def handle_get_current_prediction():
    """현재 예측 결과 요청"""
    if current_prediction:
        emit('prediction_result', current_prediction)
    else:
        emit('status', {'message': '아직 예측 결과가 없습니다.'})

if __name__ == '__main__':
    # 모델 초기화
    initialize_detector_and_model()
    
    print("웹 서버를 시작합니다...")
    print("브라우저에서 http://localhost:5000 으로 접속하세요.")
    
    # Flask 앱 실행
    socketio.run(app, host='0.0.0.0', port=5000, debug=True) 