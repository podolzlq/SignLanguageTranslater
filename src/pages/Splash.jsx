import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const SplashContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #fff;
  animation: ${props => props.disappear && fadeOut} 0.5s forwards;
`;

const LogoText = styled.h1`
  font-size: 10rem;
  font-weight: bold;
  font-family: 'Gugi', cursive;
  background: linear-gradient(135deg, #FFC0CB, #DDA0DD);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
`;

const Splash = () => {
  const navigate = useNavigate();
  const [disappear, setDisappear] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisappear(true);
      setTimeout(() => navigate('/home'), 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <SplashContainer disappear={disappear}>
      <LogoText>손짓</LogoText>
    </SplashContainer>
  );
};

export default Splash;