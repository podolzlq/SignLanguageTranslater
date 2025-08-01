import requests
import json
import base64
import numpy as np
from PIL import Image

def test_api_health():
    """API 서버 상태 확인"""
    try:
        response = requests.get('http://localhost:5000/api/health')
        print("Health Check 결과:")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health Check 실패: {e}")
        return False

def test_model_info():
    """모델 정보 확인"""
    try:
        response = requests.get('http://localhost:5000/api/model-info')
        print("\n모델 정보:")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"모델 정보 확인 실패: {e}")
        return False

def test_characters():
    """인식 가능한 문자 목록 확인"""
    try:
        response = requests.get('http://localhost:5000/api/characters')
        print("\n인식 가능한 문자:")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"문자 목록 확인 실패: {e}")
        return False

def create_test_image():
    """테스트용 이미지 생성 (검은색 배경에 흰색 사각형)"""
    # 640x480 크기의 검은색 이미지 생성
    img_array = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # 중앙에 흰색 사각형 그리기 (손 모양 시뮬레이션)
    img_array[200:280, 270:370] = [255, 255, 255]
    
    # PIL Image로 변환
    img = Image.fromarray(img_array)
    
    # Base64로 인코딩
    import io
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/jpeg;base64,{img_str}"

def test_prediction():
    """예측 API 테스트"""
    try:
        # 테스트 이미지 생성
        test_image = create_test_image()
        
        # API 호출
        response = requests.post('http://localhost:5000/api/predict', 
                               json={'image': test_image},
                               headers={'Content-Type': 'application/json'})
        
        print("\n예측 테스트 결과:")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"예측 테스트 실패: {e}")
        return False

if __name__ == "__main__":
    print("=== API 서버 테스트 시작 ===\n")
    
    # 1. Health Check
    health_ok = test_api_health()
    
    if health_ok:
        # 2. 모델 정보 확인
        model_ok = test_model_info()
        
        # 3. 문자 목록 확인
        chars_ok = test_characters()
        
        # 4. 예측 테스트
        pred_ok = test_prediction()
        
        print("\n=== 테스트 결과 요약 ===")
        print(f"Health Check: {'✅' if health_ok else '❌'}")
        print(f"Model Info: {'✅' if model_ok else '❌'}")
        print(f"Characters: {'✅' if chars_ok else '❌'}")
        print(f"Prediction: {'✅' if pred_ok else '❌'}")
        
        if all([health_ok, model_ok, chars_ok, pred_ok]):
            print("\n🎉 모든 테스트가 성공했습니다!")
        else:
            print("\n⚠️ 일부 테스트가 실패했습니다.")
    else:
        print("\n❌ API 서버에 연결할 수 없습니다.")
        print("API 서버가 실행 중인지 확인해주세요.") 