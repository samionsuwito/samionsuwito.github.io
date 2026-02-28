import React from 'react';
import './GlassCard.css';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`glass-card ${className}`}>
      <div className="glass-content">
        {children}
      </div>
    </div>
  );
};

export default GlassCard;