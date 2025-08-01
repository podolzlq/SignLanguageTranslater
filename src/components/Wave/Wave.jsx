import React from 'react';
import styled, { keyframes } from 'styled-components';

const waveSvgData = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
    <defs>
      <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFBCB7"/>
        <stop offset="100%" stop-color="#DDA9D9"/>
      </linearGradient>
    </defs>
    <path fill="url(#waveGradient)" d="
      M0,60 
      C150,20 350,100 600,60 
      C850,20 1050,100 1200,60 
      V120 H0 Z
    "/>
  </svg>
`);

const waveAnimation = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-3200px); } // 3200만큼만 이동
`;

const WaveWrapper = styled.div`
  overflow: hidden;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 200px;
  background: #FFFDE7;
  z-index: 1;
`;

const WaveLayer = styled.div`
  position: absolute;
  width: 6400px;
  height: 100%;
  display: flex;
  animation: ${waveAnimation} 6s linear infinite;
`;

const WaveSvg = styled.div`
  background: url('data:image/svg+xml;utf8,${waveSvgData}') repeat-x;
  width: 3200px; // 반으로 나눔
  height: 100%;
`;

const Wave = () => (
  <WaveWrapper>
    <WaveLayer>
      <WaveSvg />
      <WaveSvg />
    </WaveLayer>
  </WaveWrapper>
);

export default Wave;
