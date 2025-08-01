import React from 'react';
import styled, { keyframes } from 'styled-components';

const waveSvgData = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 88">
    <defs>
      <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFBCB7"/>
        <stop offset="100%" stop-color="#DDA9D9"/>
      </linearGradient>
    </defs>
    <path fill="url(#waveGradient)" d="M0,44 Q200,88 400,44 T800,44 V88 H0 Z"/>
  </svg>
`);

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

const waveAnimation = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-800px); }
`;

const WaveSvg = styled.div`
  background: url('data:image/svg+xml;utf8,${waveSvgData}') repeat-x;
  position: absolute;
  top: 0;
  width: 6400px;
  height: 100%;
  animation: ${waveAnimation} 7s linear infinite;
  transform: translate3d(0, 0, 0);
`;

const Wave = () => (
  <WaveWrapper>
    <WaveSvg />
  </WaveWrapper>
);

export default Wave;