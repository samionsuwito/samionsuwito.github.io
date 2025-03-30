import { useState } from 'react';
import './App.css';
import ShaderBackground from './components/ShaderBackground';
import GlassCard from './components/GlassCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import pfp from './assets/square.webp';

function App() {
  return (
    <>
      <ShaderBackground />
      <div className="hero-container">
        <div className="hero-title">
          <h1>SAMION<br></br>SUWITO</h1>
        </div>
        <div className="hero-card">
          <GlassCard>
            <div className="card-content">
              <h2><span>HELLO</span> WORLD</h2>
              <div className="project-info">
                <div className="project-image">
                  <img src={pfp} alt="Samion Suwito" />
                </div>
                <div className="project-details">
                  <h3>hi i'm <span style={{ color: "red", fontWeight: 900, fontStyle: "italic" }}>SAMION SUWITO</span></h3>
                  <p>
                    i was born and raised in hong kong and am now studying computer science at UC Berkeley. I love to make cool and fun projects which you can take a look at below. I'm currently working with Codebase and Sky Computing Lab at Berkeley. Outside of my studies I fencing and listening to music. <br /> <br />Feel free to reach out on any of my contacts listed here:
                  </p>
                  <div className="contact-icons">
                    <a href="mailto:samion@example.com" target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon icon={faEnvelope} />
                    </a>
                    <a href="https://github.com/samionsuwito" target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon icon={faGithub} />
                    </a>
                    <a href="https://linkedin.com/in/samionsuwito" target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon icon={faLinkedin} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

export default App;
