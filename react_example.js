// React 컴포넌트 예시 - 수화 인식 API 연동

import React, { useState, useRef, useEffect } from 'react';

const SignLanguageRecognition = () => {
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [top3, setTop3] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // 웹캠 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error('웹캠 접근 오류:', err);
      setError('웹캠에 접근할 수 없습니다.');
    }
  };

  // 웹캠 중지
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // 이미지를 Base64로 변환
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // 비디오 크기에 맞게 캔버스 설정
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 비디오 프레임을 캔버스에 그리기
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Base64로 변환
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // API 호출
  const predictSign = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const base64Image = captureImage();
      if (!base64Image) {
        throw new Error('이미지를 캡처할 수 없습니다.');
      }
      
      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPrediction(data.prediction);
        setConfidence(data.confidence);
        setTop3(data.top3);
      } else {
        setError(data.message || '인식에 실패했습니다.');
        setPrediction(null);
        setConfidence(0);
        setTop3([]);
      }
    } catch (err) {
      console.error('API 호출 오류:', err);
      setError('서버와 연결할 수 없습니다.');
      setPrediction(null);
      setConfidence(0);
      setTop3([]);
    } finally {
      setIsProcessing(false);
    }
  };

  // 실시간 인식 (1초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isProcessing) {
        predictSign();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing]);

  // 컴포넌트 마운트 시 웹캠 시작
  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>수화 인식 시스템</h1>
      
      {/* 웹캠 화면 */}
      <div style={{ marginBottom: '20px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ 
            width: '640px', 
            height: '480px', 
            border: '2px solid #333',
            borderRadius: '8px'
          }}
        />
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>
      
      {/* 인식 결과 */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>인식 결과</h2>
        
        {error ? (
          <div style={{ color: 'red', marginBottom: '10px' }}>
            오류: {error}
          </div>
        ) : null}
        
        {prediction ? (
          <div>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: 'bold', 
              color: '#2196F3',
              marginBottom: '10px'
            }}>
              {prediction}
            </div>
            <div style={{ 
              fontSize: '18px', 
              color: '#666',
              marginBottom: '20px'
            }}>
              신뢰도: {(confidence * 100).toFixed(1)}%
            </div>
            
            {/* Top 3 예측 */}
            <div>
              <h3>Top 3 예측:</h3>
              {top3.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '5px 0',
                  borderBottom: '1px solid #ddd'
                }}>
                  <span>{item.character}</span>
                  <span>{(item.confidence * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ color: '#666' }}>
            손을 카메라 앞에 보여주세요...
          </div>
        )}
        
        {isProcessing && (
          <div style={{ color: '#FF9800', marginTop: '10px' }}>
            처리 중...
          </div>
        )}
      </div>
      
      {/* 수동 인식 버튼 */}
      <button
        onClick={predictSign}
        disabled={isProcessing}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          opacity: isProcessing ? 0.6 : 1
        }}
      >
        {isProcessing ? '처리 중...' : '수동 인식'}
      </button>
    </div>
  );
};

export default SignLanguageRecognition;

// API 서버 상태 확인 함수
export const checkServerHealth = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    return data.status === 'healthy';
  } catch (err) {
    console.error('서버 상태 확인 실패:', err);
    return false;
  }
};

// 인식 가능한 문자 목록 가져오기
export const getCharacters = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/characters');
    const data = await response.json();
    return data.success ? data.characters : [];
  } catch (err) {
    console.error('문자 목록 가져오기 실패:', err);
    return [];
  }
};

// 모델 정보 가져오기
export const getModelInfo = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/model-info');
    const data = await response.json();
    return data.success ? data : null;
  } catch (err) {
    console.error('모델 정보 가져오기 실패:', err);
    return null;
  }
}; 