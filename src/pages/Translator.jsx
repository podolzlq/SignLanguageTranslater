import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam'; // ✅ react-webcam 임포트
import { Hands } from '@mediapipe/hands'; // ✅ MediaPipe 임포트
import Header from '../components/Header/Header';
import { IoClose } from 'react-icons/io5';
import './Translator.css';

const Translator = () => {
  const [isWebcamOn, setIsWebcamOn] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false); // ✅ 모델 로딩 상태
  const [currentWord, setCurrentWord] = useState('');
  const [translatedSentences, setTranslatedSentences] = useState([]);
  
  const webcamRef = useRef(null);
  const handsRef = useRef(null);
  const sentenceBuffer = useRef([]); // 단어들을 임시 저장할 버퍼
  
  useEffect(() => {
    // Translator 페이지가 마운트될 때 body 배경을 그라데이션으로 설정
    document.body.style.background = 'linear-gradient(180deg, #FFBCB7 0%, #DDA9D9 100%)';

    // 컴포넌트가 언마운트(사라질 때)될 때 실행될 클린업 함수
    return () => {
      // 다른 페이지에 영향을 주지 않도록 body 배경을 원래대로 복구
      document.body.style.background = ''; 
    };
  }, []); // []를 비워두면 컴포넌트가 처음 마운트될 때 딱 한 번만 실행됩니다.

  // ✅ 1. MediaPipe Hands 모델 초기화 함수
  const initializeMediaPipe = useCallback(() => {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    // 결과 콜백 함수
    hands.onResults(onResults);
    handsRef.current = hands;
  }, []);

  // ✅ 2. AI 담당자가 채울 부분: 수어 좌표를 받아 단어를 예측하는 함수
  const predictSign = (landmarks) => {
    // 이 곳에서 AI 담당자가 만든 TensorFlow.js 또는 PyTorch 모델을 사용하여
    // landmarks 데이터를 기반으로 단어를 예측(추론)하는 로직을 구현합니다.
    // 예시: const prediction = customModel.predict(landmarks);
    // 지금은 가상으로 단어를 반환합니다.
    const mockWords = ['안녕하세요', '저는', '감사합니다', '손짓', '입니다'];
    return mockWords[Math.floor(Math.random() * mockWords.length)];
  };

  // ✅ 3. MediaPipe가 결과를 반환할 때마다 호출되는 콜백
  const onResults = useCallback((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const predictedWord = predictSign(landmarks);
      
      // 예측된 단어가 이전과 다를 때만 상태 업데이트
      if (predictedWord !== currentWord) {
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
    }
  }, [currentWord, translatedSentences.length]);

  // ✅ 4. 웹캠이 켜지면 MediaPipe와 AI 모델을 로드하는 로직
  useEffect(() => {
    initializeMediaPipe();
    
    // 이 곳에서 AI 담당자가 만든 커스텀 모델을 로드합니다.
    const loadCustomModel = async () => {
      setIsModelLoading(true);
      // 예시: await tf.loadLayersModel('/model/model.json');
      await new Promise(resolve => setTimeout(resolve, 1500)); // 로딩 시뮬레이션
      setIsModelLoading(false);
    };

    if (isWebcamOn) {
      loadCustomModel();
    }
  }, [isWebcamOn, initializeMediaPipe]);

  // ✅ 5. 실시간 비디오 프레임을 MediaPipe로 보내는 루프
  useEffect(() => {
    const processVideo = async () => {
      if (isWebcamOn && webcamRef.current?.video && !isModelLoading) {
        await handsRef.current?.send({ image: webcamRef.current.video });
      }
      requestAnimationFrame(processVideo);
    };
    processVideo();
  }, [isWebcamOn, isModelLoading]);

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