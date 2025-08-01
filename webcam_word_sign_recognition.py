import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
import json
from sing_lang_trans.modules.holistic_module import HolisticDetector
from sing_lang_trans.modules.utils import Vector_Normalization
from PIL import ImageFont, ImageDraw, Image
import time

# 설정
seq_length = 10  # 자음+모음은 더 짧은 시퀀스
confidence_threshold = 0.9  # 신뢰도 임계값을 더 높임
fontpath = "fonts/HMKMMAG.TTF"
font = ImageFont.truetype(fontpath, 50)

# 디버깅을 위한 설정
debug_mode = True  # 디버깅 모드 활성화

def load_word_model_and_mapping():
    """자음+모음 수어 모델과 라벨 매핑 로드"""
    # 라벨 매핑 로드 (자음+모음)
    with open('processed_data/label_mapping.json', 'r', encoding='utf-8') as f:
        label_mapping = json.load(f)
    
    # 역매핑 생성
    idx_to_word = {v: k for k, v in label_mapping.items()}
    
    # TFLite 모델 로드 (자음+모음 모델)
    interpreter = tf.lite.Interpreter(model_path="models/multi_hand_gesture_classifier.tflite")
    interpreter.allocate_tensors()
    
    return interpreter, idx_to_word

def initialize_detector():
    """MediaPipe 홀리스틱 모델 초기화"""
    detector = HolisticDetector(min_detection_confidence=0.3)
    return detector

def process_hand_landmarks(right_hand_lmList):
    """손 랜드마크 처리 및 벡터 정규화"""
    joint = np.zeros((42, 2))
    for j, lm in enumerate(right_hand_lmList.landmark):
        joint[j] = [lm.x, lm.y]
    vector, angle_label = Vector_Normalization(joint)
    return np.concatenate([vector.flatten(), angle_label.flatten()])

def predict_word(interpreter, input_data):
    """TFLite 모델을 사용하여 단어 예측"""
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    interpreter.set_tensor(input_details[0]['index'], input_data)
    interpreter.invoke()
    y_pred = interpreter.get_tensor(output_details[0]['index'])
    return y_pred[0]

def draw_word_on_image(img, word, confidence, fps, debug_info=None):
    """이미지에 단어와 정보 그리기"""
    img_pil = Image.fromarray(img)
    draw = ImageDraw.Draw(img_pil)
    
    # 단어 표시
    if word != '?':
        draw.text((10, 30), f'인식: {word}', font=font, fill=(255, 255, 255))
        draw.text((10, 80), f'신뢰도: {confidence:.2f}', font=font, fill=(255, 255, 0))
        
        # 디버깅 정보 표시
        if debug_mode and debug_info:
            draw.text((10, 130), f'Top3: {debug_info}', font=font, fill=(0, 255, 255))
            draw.text((10, 180), f'FPS: {fps:.1f}', font=font, fill=(0, 255, 255))
        else:
            draw.text((10, 130), f'FPS: {fps:.1f}', font=font, fill=(0, 255, 255))
    else:
        draw.text((10, 30), '수어를 인식해주세요', font=font, fill=(255, 255, 255))
        draw.text((10, 80), f'FPS: {fps:.1f}', font=font, fill=(0, 255, 255))
    
    return np.array(img_pil)

def calculate_fps(prev_time):
    """FPS 계산"""
    current_time = time.time()
    fps = 1 / (current_time - prev_time) if current_time - prev_time > 0 else 0
    return current_time, fps

def main():
    """실시간 단어 수어 인식 메인 함수"""
    print("단어 수어 인식 시스템 시작...")
    
    # 모델과 매핑 로드
    interpreter, idx_to_word = load_word_model_and_mapping()
    detector = initialize_detector()
    
    # 웹캠 초기화
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    if not cap.isOpened():
        print("웹캠을 열 수 없습니다!")
        return
    
    print("웹캠 연결 성공!")
    print("ESC 키를 누르면 종료됩니다.")
    
    # 변수 초기화
    seq = []
    word_seq = []
    last_word = None
    prev_time = time.time()
    
    while cap.isOpened():
        ret, img = cap.read()
        if not ret:
            break
        
        # FPS 계산
        prev_time, fps = calculate_fps(prev_time)
        
        # 이미지 좌우 반전 (거울 효과)
        img = cv2.flip(img, 1)
        
        # MediaPipe 홀리스틱 처리
        img = detector.findHolistic(img, draw=True)
        _, right_hand_lmList = detector.findRighthandLandmark(img)
        
        if right_hand_lmList is not None:
            # 손 랜드마크 처리
            d = process_hand_landmarks(right_hand_lmList)
            seq.append(d)
            
            # 시퀀스 길이 확인
            if len(seq) < seq_length:
                continue
            
            # 입력 데이터 준비
            input_data = np.expand_dims(np.array(seq[-seq_length:], dtype=np.float32), axis=0)
            
            # 단어 예측
            y_pred = predict_word(interpreter, input_data)
            i_pred = int(np.argmax(y_pred))
            conf = y_pred[i_pred]
            
            # 디버깅 정보 생성 (Top3 예측)
            top3_indices = np.argsort(y_pred)[-3:][::-1]
            debug_info = ""
            for i, idx in enumerate(top3_indices):
                debug_info += f"{idx_to_word[idx]}({y_pred[idx]:.2f})"
                if i < 2:
                    debug_info += ", "
            
            # 신뢰도 임계값 확인
            if conf < confidence_threshold:
                # 임계값 미달이어도 디버깅 정보 표시
                if debug_mode:
                    img = draw_word_on_image(img, '?', 0.0, fps, debug_info)
                continue
            
            predicted_word = idx_to_word[i_pred]
            word_seq.append(predicted_word)
            
            # 연속된 예측 확인 (3번 연속 같은 단어로 변경)
            if len(word_seq) < 3:
                continue
            
            current_word = '?'
            if word_seq[-1] == word_seq[-2] == word_seq[-3]:
                current_word = predicted_word
                if last_word != current_word:
                    last_word = current_word
                    print(f"인식된 자음/모음: {current_word} (신뢰도: {conf:.3f})")
                    print(f"Top3 예측: {debug_info}")
            
            # 이미지에 결과 표시
            img = draw_word_on_image(img, current_word, conf, fps, debug_info)
        else:
            # 손이 감지되지 않을 때
            img = draw_word_on_image(img, '?', 0.0, fps)
            seq = []  # 시퀀스 초기화
            word_seq = []  # 단어 시퀀스 초기화
        
        # 결과 표시
        cv2.imshow('단어 수어 인식', img)
        
        # ESC 키로 종료
        if cv2.waitKey(1) & 0xFF == 27:
            break
    
    cap.release()
    cv2.destroyAllWindows()
    print("단어 수어 인식 시스템 종료")

def test_model_loading():
    """모델 로딩 테스트"""
    try:
        interpreter, idx_to_word = load_word_model_and_mapping()
        print("모델 로딩 성공!")
        print(f"인식 가능한 단어 수: {len(idx_to_word)}")
        print("인식 가능한 단어들:")
        for idx, word in idx_to_word.items():
            print(f"  {idx}: {word}")
        return True
    except Exception as e:
        print(f"모델 로딩 실패: {e}")
        return False

if __name__ == "__main__":
    # 모델 로딩 테스트
    if test_model_loading():
        main()
    else:
        print("모델 파일을 먼저 생성해주세요.")
        print("1. word_sign_language_dataset.py 실행하여 데이터셋 생성")
        print("2. train_word_sign_model.py 실행하여 모델 훈련") 