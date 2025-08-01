// 필요한 라이브러리들을 모두 import 합니다.
// npm install react-webcam @mediapipe/holistic @mediapipe/camera_utils @mediapipe/drawing_utils onnxruntime-web react-icons
import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { Holistic } from '@mediapipe/holistic';
import { Camera } from '@mediapipe/camera_utils';
import { InferenceSession, Tensor } from 'onnxruntime-web';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS, HAND_CONNECTIONS } from '@mediapipe/holistic';

import Header from '../../components/Header/Header';
import { IoEyeOutline, IoHappyOutline, IoEnterOutline, IoHelpCircleOutline, IoCheckmarkCircle } from "react-icons/io5";
import './Education.css';

// 학습할 단어 데이터
const challenges = [
  { word: '감기', videoSrc: '/videos/NIA_SL_WORD1537_REAL01_D.mp4' },
  { word: '고민', videoSrc: '/videos/NIA_SL_WORD1501_REAL01_D.mp4' },
  { word: '라면', videoSrc: '/videos/NIA_SL_WORD1590_REAL01_D.mp4' },
  { word: '수어', videoSrc: '/videos/NIA_SL_WORD1503_REAL01_D.mp4' },
  { word: '슬프다', videoSrc: '/videos/NIA_SL_WORD1509_REAL01_D.mp4' }

];

// 헬퍼 함수: MediaPipe 결과를 411차원 벡터로 변환
// 🚨 중요: 이 함수는 모델 학습 시 사용한 데이터 전처리 방식과 완벽히 일치해야 합니다.
// 아래는 일반적인 구현 예시이며, 실제 모델에 맞게 반드시 수정이 필요합니다.
const extractKeypoints = (results) => {
  // pose, left_hand, right_hand의 랜드마크 좌표(x,y,z,visibility)를 하나의 배열로 합칩니다.
  const pose = results.poseLandmarks ? results.poseLandmarks.map(res => [res.x, res.y, res.z, res.visibility]).flat() : new Array(33 * 4).fill(0);
  const lh = results.leftHandLandmarks ? results.leftHandLandmarks.map(res => [res.x, res.y, res.z]).flat() : new Array(21 * 3).fill(0);
  const rh = results.rightHandLandmarks ? results.rightHandLandmarks.map(res => [res.x, res.y, res.z]).flat() : new Array(21 * 3).fill(0);

  let keypoints = [...pose, ...lh, ...rh];

  // 🚨 현재 258개 특징점만 추출됩니다. 모델이 요구하는 411개에 맞추기 위해
  // 어떤 데이터를 사용했는지 확인하고 이 부분을 수정해야 합니다.
  // (예: faceLandmarks 포함, 랜드마크 간 각도/거리 계산 등)
  // 여기서는 부족한 부분을 0으로 채우는(padding) 임시 처리를 합니다.
  if (keypoints.length < 411) {
      keypoints = keypoints.concat(new Array(411 - keypoints.length).fill(0));
  } else if (keypoints.length > 411) {
      keypoints = keypoints.slice(0, 411);
  }

  return keypoints;
};

// 1. 인트로 화면 컴포넌트 (변경 없음)
const IntroScreen = ({ onGameStart }) => (
  <div className="intro-container">
    <div className="intro-card">
      <h1>따라해요 손짓</h1>
      <p className="intro-paragraph">
        따라해요 손짓에 오신 것을 환영합니다!<br />
        수어 학습이 이렇게 재미있을 수 있을까요?<br />
        여러분의 수어 친구가 함께 할 '따라해요 손짓'에 오신 것을 환영해요!
      </p>

      <div className="intro-steps">
        <div className="intro-step-item">
          <IoEyeOutline className="step-icon" />
          <div className="step-description">
            <div className="step-number">1</div>
            <span>동작을 눈으로 익히고</span>
          </div>
        </div>
        <div className="intro-step-item">
          <IoHappyOutline className="step-icon" />
          <div className="step-description">
            <div className="step-number">2</div>
            <span>카메라를 보며 따라해주세요</span>
          </div>
        </div>
        <div className="intro-step-item">
          <IoEnterOutline className="step-icon" />
          <div className="step-description">
            <div className="step-number">3</div>
            <span>정답을 맞혔다면, 다음 단계로!</span>
          </div>
        </div>
      </div>

      <p className="intro-challenge-text">지금 바로 첫 번째 손짓에 도전해 볼까요?</p>
    </div>
    <button className="game-start-button" onClick={onGameStart}>
      <div className="character-avatar"></div>
      <span>Game Start!</span>
    </button>
  </div>
);

// 2. 게임 진행 화면 컴포넌트 (수정된 전체 코드)
const GameScreen = ({ onCorrectAnswer, currentChallengeIndex }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null); // ✅ 비디오 요소를 위한 ref 추가

  const onnxSession = useRef(null);
  const sequence = useRef([]);
  const cameraRef = useRef(null);

  // ✅ 영상 재생 횟수를 추적하는 state 추가
  const [playCount, setPlayCount] = useState(0);

  const classLabels = ['감기', '고민', '라면', '수어', '슬프다'];
  const currentChallenge = challenges[currentChallengeIndex];

  // AI 모델 로드 및 MediaPipe Holistic 설정 (카메라 시작 로직은 분리)
  useEffect(() => {
    const setupModelAndHolistic = async () => {
      // 1. ONNX 모델 로드
      try {
        const session = await InferenceSession.create('/sign_language_model_5_words.onnx', {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
        });
        onnxSession.current = session;
        console.log("ONNX Model loaded.");
      } catch (e) {
        console.error("ONNX 모델 로딩 실패.", e);
      }
    };

    setupModelAndHolistic();
  }, []); // 최초 1회만 실행

  // ✅ 문제가 바뀌면 재생 횟수를 리셋
  useEffect(() => {
    setPlayCount(0);
  }, [currentChallengeIndex]);


  // ✅ 웹캠이 성공적으로 켜졌을 때 MediaPipe 카메라를 시작하는 함수
  const startMediaPipeCamera = () => {
    const holistic = new Holistic({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
    });

    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    holistic.onResults(onResults);

    if (webcamRef.current && webcamRef.current.video) {
      cameraRef.current = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current && webcamRef.current.video) {
            await holistic.send({ image: webcamRef.current.video });
          }
        },
        width: 640,
        height: 480
      });
      cameraRef.current.start();
      console.log("MediaPipe Camera started.");
    }
  };


  const onResults = async (results) => {
    // AI 추론 로직은 그대로 유지 (필요 시 주석 처리 또는 삭제)
    // 현재 요구사항은 영상 2회 재생 후 정답 처리이므로, 이 부분의 중요도는 낮아짐
    if (!webcamRef.current || !canvasRef.current || !onnxSession.current) {
      return;
    }
    const canvasCtx = canvasRef.current.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    // 랜드마크 그리기 등 시각적 피드백이 필요하면 여기에 코드 추가
    canvasCtx.restore();

    // AI 추론을 계속 사용하고 싶다면 아래 코드 유지
    const keypoints = extractKeypoints(results);
    sequence.current.push(keypoints);
    sequence.current = sequence.current.slice(-150);
    if (sequence.current.length === 150) {
      // ... (기존 AI 추론 코드) ...
    }
  };

  // ✅ 영상 재생이 끝날 때마다 호출되는 함수
  const handleVideoEnded = () => {
    const newPlayCount = playCount + 1;
    setPlayCount(newPlayCount);

    if (newPlayCount === 1) { // 첫 번째 재생이 끝나면
      videoRef.current.play(); // 다시 재생
    } else if (newPlayCount >= 2) { // 두 번째 재생이 끝나면
      console.log("영상 2회 재생 완료. 정답 처리!");
      onCorrectAnswer(currentChallenge.word); // 정답 처리 함수 호출
    }
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="character-avatar"></div>
        <p>자, 게임 시작! 화면에 나타나는 캐릭터의 손짓을 잘 보고 그대로 따라 해보세요.</p>
      </div>
      <div className="game-grid">
        <div className="video-panel">
          {/* ✅ loop 속성 제거, ref와 onEnded 이벤트 핸들러 추가 */}
          <video
            ref={videoRef}
            key={currentChallenge.videoSrc}
            width="100%"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnded}
          >
            <source src={currentChallenge.videoSrc} type="video/mp4" />
          </video>
        </div>
        <div className="webcam-panel">
          <div className="webcam-header">
            <span>카메라 {cameraRef.current ? "✅" : "⏳"}</span>
            <input type="checkbox" defaultChecked readOnly />
          </div>
          <div className="webcam-view" style={{ position: 'relative' }}>
            {/* ✅ onUserMedia를 사용해 카메라가 켜진 직후 콜백 함수 실행 */}
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored={true}
              onUserMedia={startMediaPipeCamera}
              style={{
                position: 'absolute', left: 0, top: 0,
                width: '100%', height: '100%', zIndex: 1,
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute', left: 0, top: 0,
                width: '100%', height: '100%', zIndex: 2,
              }}
            ></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. 정답 화면 컴포넌트 (변경 없음)
const CorrectScreen = ({ word, onNextChallenge }) => (
  <div className="game-container">
    <div className="game-header">
      <img src="/character.png" alt="캐릭터" />
      <p>정확히 따라했어요!</p>
    </div>
    <div className="game-grid correct-grid">
        <div className="video-panel">
            <img src="/correct_example.png" alt="정답 예시" />
        </div>
        <div className="webcam-panel">
            <div className="webcam-header">
                <span>카메라</span>
                <input type="checkbox" defaultChecked readOnly />
            </div>
            <div className="webcam-view">
              <Webcam audio={false} mirrored={true} />
            </div>
        </div>
    </div>
    <div className="correct-feedback">
      <div className="answer-box">
        <IoCheckmarkCircle /> {word}!
      </div>
      <button className="next-challenge-button" onClick={onNextChallenge}>
        다음
      </button>
    </div>
  </div>
);

// 메인 Education 컴포넌트 (변경 없음)
const Education = () => {
  const [gameState, setGameState] = useState('intro'); // 'intro', 'playing', 'correct'
  const [correctWord, setCorrectWord] = useState('');
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);

  useEffect(() => {
    document.body.style.background = 'linear-gradient(180deg, #FFBCB7 0%, #DDA9D9 100%)';
    return () => { document.body.style.background = ''; };
  }, []);

  const handleGameStart = () => {
    // 게임 시작 시 첫 번째 챌린지를 랜덤으로 선택
    const firstIndex = Math.floor(Math.random() * challenges.length);
    setCurrentChallengeIndex(firstIndex);
    setGameState('playing');
  };

  const handleCorrectAnswer = (word) => {
    setCorrectWord(word);
    setGameState('correct');
  };

  // ✅ 다음 챌린지를 랜덤으로 선택하도록 수정된 함수
  const handleNextChallenge = () => {
    let nextIndex;
    // 현재 챌린지와 다른 챌린지가 선택될 때까지 반복
    do {
      nextIndex = Math.floor(Math.random() * challenges.length);
    } while (challenges.length > 1 && nextIndex === currentChallengeIndex);

    setCurrentChallengeIndex(nextIndex);
    setGameState('playing');
  };


  return (
    <div className="education-container">
      <Header />
      <div className="help-tooltip-wrapper">
        <IoHelpCircleOutline className="help-icon" />
        <div className="tooltip-box">
          <ul>
            <li>카메라와 1-2미터 거리를 유지해주세요.</li>
            <li>충분한 조명이 있는 곳에서 사용해주세요.</li>
            <li>손과 팔이 화면에 잘 보이도록 해주세요.</li>
            <li>천천히 수어해주세요.</li>
          </ul>
        </div>
      </div>

      {gameState === 'intro' && <IntroScreen onGameStart={handleGameStart} />}
      {gameState === 'playing' && <GameScreen onCorrectAnswer={handleCorrectAnswer} currentChallengeIndex={currentChallengeIndex} />}
      {gameState === 'correct' && <CorrectScreen word={correctWord} onNextChallenge={handleNextChallenge} />}
    </div>
  );
};

export default Education;