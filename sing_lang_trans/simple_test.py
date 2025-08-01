import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
import modules.holistic_module as hm
from modules.utils import Vector_Normalization

# 설정
actions = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
           'ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ',
           'ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅢ', 'ㅚ', 'ㅟ']
seq_length = 10

def initialize_detector_and_model():
    """MediaPipe 홀리스틱 모델과 TFLite 모델 초기화"""
    detector = hm.HolisticDetector(min_detection_confidence=0.3)
    interpreter = tf.lite.Interpreter(model_path="../models/multi_hand_gesture_classifier.tflite")
    interpreter.allocate_tensors()
    return detector, interpreter

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

def main():
    print("자음/모음 수어 인식 테스트 시작...")
    
    # 영문 매핑 정의
    action_eng = {
        'ㄱ': 'GIYEOK', 'ㄴ': 'NIEUN', 'ㄷ': 'DIGEUT', 'ㄹ': 'RIEUL', 'ㅁ': 'MIEUM',
        'ㅂ': 'BIEUP', 'ㅅ': 'SIOT', 'ㅇ': 'IEUNG', 'ㅈ': 'JIEUT', 'ㅊ': 'CHIEUT',
        'ㅋ': 'KIEUK', 'ㅌ': 'TIEUT', 'ㅍ': 'PIEUP', 'ㅎ': 'HIEUT',
        'ㅏ': 'A', 'ㅑ': 'YA', 'ㅓ': 'EO', 'ㅕ': 'YEO', 'ㅗ': 'O', 'ㅛ': 'YO',
        'ㅜ': 'U', 'ㅠ': 'YU', 'ㅡ': 'EU', 'ㅣ': 'I',
        'ㅐ': 'AE', 'ㅒ': 'YAE', 'ㅔ': 'E', 'ㅖ': 'YE', 'ㅢ': 'UI', 'ㅚ': 'OE', 'ㅟ': 'WI'
    }
    
    detector, interpreter = initialize_detector_and_model()
    print("모델 로딩 완료!")
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("웹캠을 열 수 없습니다!")
        return
    
    print("웹캠 연결 성공!")
    print("ESC 키를 누르면 종료됩니다.")
    
    seq = []
    frame_count = 0

    while cap.isOpened():
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
            
            print(f"프레임 {frame_count}: 손 감지됨")

            # 시퀀스 길이 확인
            if len(seq) >= seq_length:
                # 입력 데이터 준비
                input_data = np.expand_dims(np.array(seq[-seq_length:], dtype=np.float32), axis=0)
                
                # 예측
                y_pred = predict_action(interpreter, input_data)
                i_pred = int(np.argmax(y_pred))
                conf = y_pred[i_pred]
                
                predicted_action = actions[i_pred]
                
                # 결과 표시
                print(f"예측: {predicted_action} (NIEUN), 신뢰도: {conf:.3f}")
                
                # 상위 3개 예측 결과도 표시
                top_indices = np.argsort(y_pred)[-3:][::-1]
                print(f"상위 3개 예측:")
                for i, idx in enumerate(top_indices):
                    print(f"  {i+1}위: {actions[idx]} ({action_eng.get(actions[idx], actions[idx])}): {y_pred[idx]:.3f}")
                
                # 화면에 결과 표시 (영문으로 표시)
                display_text = f'{action_eng.get(predicted_action, predicted_action)}: {conf:.2f}'
                cv2.putText(img, display_text, (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                # 신뢰도가 높으면 색상 변경
                if conf > 0.8:
                    cv2.putText(img, f'HIGH CONFIDENCE!', (10, 70), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                
                # 디버깅용: 화면에 프레임 번호도 표시
                cv2.putText(img, f'Frame: {frame_count}', (10, 110), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        else:
            print(f"프레임 {frame_count}: 손 감지 안됨")
            cv2.putText(img, 'No Hand Detected', (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        # 결과 표시
        cv2.imshow('자음/모음 수어 인식 테스트', img)
        
        # ESC 키로 종료
        if cv2.waitKey(1) & 0xFF == 27:
            break

    cap.release()
    cv2.destroyAllWindows()
    print("테스트 종료")

if __name__ == "__main__":
    main() 