import { useEffect, useRef, useState } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import pfp from './assets/square.webp';
import { BIO, NAME, startAssemble } from './assembleCanvas';

const LINKS = [
  { href: 'mailto:samion@berkeley.edu', label: 'Email', icon: faEnvelope, external: false },
  {
    href: 'https://scholar.google.com/citations?user=QBEH7_4AAAAJ&hl=en',
    label: 'Google Scholar',
    icon: faGraduationCap,
    external: true,
  },
  { href: 'https://github.com/samionsuwito', label: 'GitHub', icon: faGithub, external: true },
  { href: 'https://linkedin.com/in/samionsuwito', label: 'LinkedIn', icon: faLinkedin, external: true },
] as const;

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const [settled, setSettled] = useState(false);
  const [slot, setSlot] = useState({ nameH: 28, bioH: 80, contentW: 576 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const photo = photoRef.current;
    if (!canvas || !photo) return;

    const scene = startAssemble({
      canvas,
      photo,
      onMetrics: setSlot,
      onSettled: () => setSettled(true),
    });

    return () => scene.destroy();
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="field" aria-hidden="true" />
      <main className={`page${settled ? ' is-settled' : ''}`}>
        <img ref={photoRef} className="photo" src={pfp} alt="" />
        <div
          className="text-slot"
          style={{ height: slot.nameH + 16 + slot.bioH, maxWidth: slot.contentW }}
          aria-hidden="true"
        />
        <nav className="links" aria-label="Links">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              aria-label={link.label}
            >
              <FontAwesomeIcon icon={link.icon} />
            </a>
          ))}
        </nav>
      </main>
      <h1 className="sr-only">{NAME}</h1>
      <p className="sr-only">{BIO}</p>
    </>
  );
}

export default App;
