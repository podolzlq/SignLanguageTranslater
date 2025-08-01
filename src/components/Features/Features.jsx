// src/components/Features/Features.jsx
import React, { forwardRef } from 'react';
import './Features.css';

const Features = forwardRef((props, ref) => {
  return (
    <section id="features" className="features-section" ref={ref}>
      <div className="features-content-block">
        <h2 className="feature-title">따뜻한 기술로 만드는 소통의 다리</h2>
        <p>최신 AI 기술을 활용하여 수어를 실시간으로 인식하고 번역합니다.<br />청각장애인과 비장애인 모두가 편안하게 대화할 수 있는 환경을 제공합니다.</p>

        <div className="features-grid">
          <div className="feature-item">
            <div className="icon">
              <img src="/front_hand_2.png" alt="정확한 인식 아이콘" />
            </div>
            <h3>정확한 인식</h3>
            <p>고도화된 AI모델로 다양한 수어 동작을<br />정확하게 인식합니다.</p>
          </div>
          <div className="feature-item">
            <div className="icon">
              <img src="/comment.png" alt="실시간 번역 아이콘" />
            </div>
            <h3>실시간 번역</h3>
            <p>지연 없이 즉시 텍스트와 음성으로<br />변환하여 자연스러운 대화를 돕습니다.</p>
          </div>
          <div className="feature-item">
            <div className="icon">
              <img src="/gmail_groups.png" alt="접근성 우선 아이콘" />
            </div>
            <h3>접근성 우선</h3>
            <p>모든 사용자가 쉽고 편리하게 이용할 수<br />있는 인터페이스를 제공합니다.</p>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Features;