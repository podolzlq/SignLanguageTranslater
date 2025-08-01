import React, { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Wave from '../Wave/Wave';
import './Hero.css';

const Hero = forwardRef(({ onScrollToNext }, ref) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/translator');
  };

  return (
    <section id="home" className="hero-section" ref={ref}>
      <div className="content-separator"></div>
      <div className="hero-logo">
        <span className="logo-text-gugi">손짓</span>
        <img src="/front_hand.png" alt="손 아이콘" className="logo-icon-gugi" />
      </div>
      <div className="hero-content">
        <div className="headline-container">
          <div className="headline-line headline-line-1">
            <img src="/front_hand.png" alt="손 아이콘" className="headline-icon" />
            <span className="text-dongle">
              당신의 <span className="gradient-highlight">손짓</span>을
            </span>
          </div>
          <div className="headline-line headline-line-2">
            <span className="text-dongle">세상과 잇다</span>
          </div>
        </div>
        <div className="button-group">
          <button className="btn-primary" onClick={handleNavigate}>손짓 연결하기</button>
          <button className="btn-secondary" onClick={onScrollToNext}>더 알아보기</button>
        </div>
      </div>
      <Wave />
    </section>
  );
});

export default Hero;