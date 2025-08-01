import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam'; // ✅ react-webcam 임포트
import Header from '../../components/Header/Header';
import { IoClose } from 'react-icons/io5';
import './Translator.css';

const Translator = () => {
  const [isWebcamOn, setIsWebcamOn] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false); // ✅ 모델 로딩 상태
  const [currentWord, setCurrentWord] = useState('');
  const [translatedSentences, setTranslatedSentences] = useState([]);
  
  const webcamRef = useRef(null);
  const sentenceBuffer = useRef([]); // 단어들을 임시 저장할 버퍼
  const intervalRef = useRef(null); // 인터벌 참조
  
  useEffect(() => {
    // Translator 페이지가 마운트될 때 body 배경을 그라데이션으로 설정
    document.body.style.background = 'linear-gradient(180deg, #FFBCB7 0%, #DDA9D9 100%)';

    // 컴포넌트가 언마운트(사라질 때)될 때 실행될 클린업 함수
    return () => {
      // 다른 페이지에 영향을 주지 않도록 body 배경을 원래대로 복구
      document.body.style.background = ''; 
    };
  }, []); // []를 비워두면 컴포넌트가 처음 마운트될 때 딱 한 번만 실행됩니다.

  // ✅ 1. API 서버 연결 확인 함수
  const checkAPIServer = useCallback(async () => {
    try {
      console.log('API 서버 연결 시도 중...');
      const response = await fetch('http://localhost:5000/api/health');
      console.log('API 응답 상태:', response.status);
      const data = await response.json();
      console.log('API 응답 데이터:', data);
      if (data.status === 'healthy') {
        console.log('API 서버 연결 성공!');
        return true;
      } else {
        console.error('API 서버 상태 이상:', data);
        return false;
      }
    } catch (error) {
      console.error('API 서버 연결 실패:', error);
      return false;
    }
  }, []);

  // ✅ 2. API 서버를 통한 수어 인식 함수
  const predictSign = async () => {
    try {
      // 웹캠 이미지를 Base64로 변환
      const canvas = document.createElement('canvas');
      const video = webcamRef.current?.video;
      if (!video) {
        console.log('카메라 비디오 없음');
        return '카메라 없음';
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      console.log('이미지 캡처 완료, API 요청 시작');
      
      // API 서버에 요청
      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      
      const data = await response.json();
      console.log('API 응답:', data);
      
      if (data.success) {
        console.log('인식 성공:', data.prediction, '신뢰도:', data.confidence);
        return data.prediction;
      } else {
        console.log('인식 실패:', data.message);
        return '인식 실패';
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
      return '연결 오류';
    }
  };



  // ✅ 4. 웹캠이 켜지면 API 서버 연결 확인
  useEffect(() => {
    if (isWebcamOn) {
      console.log('웹캠 켜짐 - API 서버 연결 확인 시작');
      setIsModelLoading(true);
      
      // API 서버 연결 확인 (한 번만)
      const connectToAPI = async () => {
        try {
          const isConnected = await checkAPIServer();
          console.log('API 서버 연결 결과:', isConnected);
          if (isConnected) {
            // API 서버 연결 성공 시 실시간 인식 시작
            intervalRef.current = setInterval(async () => {
              if (!isWebcamOn || isModelLoading) return;
              
              const predictedWord = await predictSign();
              
              // 디버깅을 위한 로그 추가
              console.log('예측된 단어:', predictedWord);
              
              // 예측된 단어가 이전과 다를 때만 상태 업데이트
              if (predictedWord !== currentWord && predictedWord !== '인식 실패' && predictedWord !== '연결 오류' && predictedWord !== '카메라 없음') {
                console.log('새로운 단어 인식됨:', predictedWord);
                setCurrentWord(predictedWord);
                sentenceBuffer.current.push(predictedWord);

                // 단어가 3개 모이면 문장으로 만들어 로그에 추가
                if (sentenceBuffer.current.length >= 3) {
                  const newSentence = {
                    id: Date.now(),
                    title: `문장 ${translatedSentences.length + 1}`,
                    text: sentenceBuffer.current.join(' '),
                  };
                  setTranslatedSentences(prev => [newSentence, ...prev.slice(0, 9)]); // 최대 10개 문장 유지
                  sentenceBuffer.current = [];
                }
              }
            }, 1000); // 1초마다 인식
            console.log('실시간 인식 시작됨');
          }
          console.log('모델 로딩 상태 해제');
          setIsModelLoading(false);
        } catch (error) {
          console.error('API 서버 연결 오류:', error);
          setIsModelLoading(false);
        }
      };
      
      connectToAPI();
    } else {
      console.log('웹캠 꺼짐 - 인터벌 정리');
      // 웹캠이 꺼지면 인터벌 정리
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isWebcamOn]); // 의존성 배열에서 initializeMediaPipe 제거

  // ✅ 5. MediaPipe 제거 - API 서버만 사용

  return (
    <div className="translator-container">
      <Header />
      <div className="content-wrapper">
        <h1 className="page-title">실시간 수어 통역</h1>
        <div className="grid-container">
          <div className="grid-item webcam-card">
            <div className="card-header">
              <h3>웹캠 화면</h3>
              <div className="camera-toggle">
                <span>카메라</span>
                <input type="checkbox" checked={isWebcamOn} readOnly onClick={() => setIsWebcamOn(!isWebcamOn)} />
              </div>
            </div>
            <div className="webcam-body">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="webcam-video"
                hidden={!isWebcamOn} // 웹캠이 꺼져있을 땐 숨김
              />
              {isModelLoading && <div className="loading-overlay">AI 모델을 불러오는 중...</div>}
              {!isWebcamOn && (
                <div className="webcam-placeholder" onClick={() => setIsWebcamOn(true)}>
                  카메라 버튼을 눌러주세요
                </div>
              )}
            </div>
          </div>
          
          <div className="grid-item translated-card">
            <h3>번역된 문장</h3>
            <div className="translated-list">
              {translatedSentences.map(sentence => (
                <div key={sentence.id} className="translated-item">
                  <div className="item-header"><span>{sentence.title}</span><button className="close-btn"><IoClose /></button></div>
                  <p>{sentence.text}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid-item recognized-card">
            <h3>현재 인식된 단어</h3>
            <div className="recognized-content">
              <span>{isWebcamOn ? (currentWord || '...') : ''}</span>
              <p>{isWebcamOn ? (currentWord ? '단어가 인식되었습니다' : '인식 대기 중...') : ''}</p>
            </div>
          </div>
          
          <div className="grid-item tips-card">
            <h3>사용 팁</h3>
            <ul>
              <li>카메라와 1-2미터 거리를 유지해주세요.</li>
              <li>충분한 조명이 있는 곳에서 사용해주세요.</li>
              <li>손과 팔이 화면에 잘 보이도록 찍주세요.</li>
              <li>천천히 수어해주세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Translator;