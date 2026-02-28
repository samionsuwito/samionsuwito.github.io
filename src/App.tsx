import { useState } from 'react';
import './App.css';
import ShaderBackground from './components/ShaderBackground';
import GlassCard from './components/GlassCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faEnvelope, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import pfp from './assets/square.webp';

function App() {
  const experiences = [
    {
      company: 'Amazon',
      date: 'Sep. 2025 - Dec 2025',
      highlights: [
        'Built an intelligent Kubernetes auto-scaling system for DeltaCAT on AWS EKS, automating cluster provisioning and scaling for Ray-based data jobs.',
        'Implemented predictive resource allocation algorithms using Python, Ray, and DeltaCAT to optimize CPU, memory, and storage utilization across distributed compute nodes.',
        'Integrated Kubernetes-native job orchestration with dynamic scaling and real-time monitoring.',
      ],
    },
    {
      company: 'PayPal',
      date: 'Sep. 2024 - Feb. 2025',
      highlights: [
        'Built agentic workflow using CrewAI and LangChain to automate PRD creation, refinement, and readiness evaluation with multi-perspective AI feedback.',
        'Deployed Llama-based agents to generate AI-driven insights across engineering tools, accelerating feedback cycles and improving documentation quality.',
        'Delivered readiness metrics and trends through Slack and a dynamic dashboard made with NextJS.',
      ],
    },
    {
      company: 'Recidiviz',
      date: 'Feb. 2025 - May 2025',
      highlights: [
        'Designed automated LLM-driven check-in system for justice-involved individuals, reducing unnecessary in-person visits while flagging urgent needs.',
        'Built an interactive UI and evaluation framework to test LLM outputs and integrated a confidence score and recommended timing for generated follow-ups.',
        'Integrated Twilio to enable live SMS testing of LLM-generated check-ins and responses, facilitating end-to-end validation and demonstrating real-world feasibility.',
      ],
    },
  ];

  const [activeExperience, setActiveExperience] = useState(0);
  const currentExperience = experiences[activeExperience];

  const goToPreviousExperience = () => {
    setActiveExperience((prev) => (prev - 1 + experiences.length) % experiences.length);
  };

  const goToNextExperience = () => {
    setActiveExperience((prev) => (prev + 1) % experiences.length);
  };

  return (
    <>
      <ShaderBackground />
      <div className="gradient-overlay"></div>
      
      <div className="page-container">
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
                    <h3>hi i'm <span style={{ color: "red", fontWeight: 900, fontStyle: "italic", textShadow: "0 0 6px red" }}>SAMION SUWITO</span></h3>
                    <p>
                      i was born and raised in hong kong and study computer science at UC Berkeley. I am currently working with <span className="hello-emphasis">xAI as a Member of Technical Staff</span> and previously did research at Sky Computing Lab. I make agents.
                    </p>
                    <div className="contact-icons">
                      <a href="mailto:samion@berkeley.edu" target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faEnvelope} />
                      </a>
                      <a href="https://scholar.google.com/citations?user=QBEH7_4AAAAJ&hl=en" target="_blank" rel="noopener noreferrer" aria-label="Google Scholar">
                        <FontAwesomeIcon icon={faGraduationCap} />
                      </a>
                      <a href="https://github.com/samionsuwito" target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faGithub} />
                      </a>
                      <a href="https://linkedin.com/in/samionsuwito" target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faLinkedin} />
                      </a>
                    </div>
                    <div className="research-section">
                      <h4>Research</h4>
                      <ul className="publication-list">
                        <li className="publication-item">
                          <p className="publication-title">
                            <a href="https://arxiv.org/pdf/2509.00997" target="_blank" rel="noopener noreferrer">
                              Supporting Our AI Overlords: Redesigning Data Systems to be Agent-First
                            </a>
                            <span className="publication-date"> August 2025</span>
                          </p>
                          <p className="publication-meta publication-authors">
                            Liu, S., Ponnapalli, S., Shankar, S., Zeighami, S., Zhu, A., Agarwal, S., Chen, R., <span className="name-accent-inline">Suwito, S.</span>, Yuan, S., Stoica, I., Zaharia, M., Cheung, A., Crooks, N., Gonzalez, J. E., &amp; Parameswaran, A. G.
                          </p>
                          <p className="publication-meta publication-accepted">Accepted at CIDR 2026</p>
                        </li>
                        <li className="publication-item">
                          <p className="publication-title">
                            <a href="https://openreview.net/pdf?id=VNPGUGbC1p" target="_blank" rel="noopener noreferrer">
                              SkyRL-SQL: Multi-turn SQL Data Agents via RL
                            </a>
                            <span className="publication-date"> September 2025</span>
                          </p>
                          <p className="publication-meta publication-authors">
                            Liu, S., Zhu, A., Hegde, S., Cao, S., Yuan, S., <span className="name-accent-inline">Suwito, S.</span>, Griggs, T., Zaharia, M., Gonzalez, J. E., Stoica, I.
                          </p>
                          <p className="publication-meta publication-accepted">Accepted at NeurIPS 2025 Workshop on Multi-Turn Interactions in Large Language Models.</p>
                        </li>
                      </ul>
                    </div>
                    <div className="experience-section">
                      <h4>Experience</h4>
                      <div className="experience-carousel">
                        <button
                          type="button"
                          className="carousel-btn"
                          onClick={goToPreviousExperience}
                          aria-label="Previous experience"
                        >
                          <FontAwesomeIcon icon={faChevronLeft} className="carousel-btn-icon" />
                        </button>

                        <div className="experience-slide">
                          <p className="experience-header">
                            <span className="experience-company">{currentExperience.company}</span>{' '}
                            <span className="experience-date">{currentExperience.date}</span>
                          </p>
                          <ul className="experience-highlights">
                            {currentExperience.highlights.map((highlight) => (
                              <li key={highlight}>{highlight}</li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          className="carousel-btn"
                          onClick={goToNextExperience}
                          aria-label="Next experience"
                        >
                          <FontAwesomeIcon icon={faChevronRight} className="carousel-btn-icon" />
                        </button>
                      </div>
                      <div className="carousel-dots" aria-label="Experience carousel indicators">
                        {experiences.map((experience, index) => (
                          <button
                            key={experience.company}
                            type="button"
                            className={`carousel-dot ${index === activeExperience ? 'active' : ''}`}
                            onClick={() => setActiveExperience(index)}
                            aria-label={`Go to ${experience.company} experience`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
