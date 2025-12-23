
import React from 'react';

interface NeobrutalCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const NeobrutalCard: React.FC<NeobrutalCardProps> = ({ children, className = "", title }) => {
  return (
    <div className={`bg-black text-white border-4 border-white p-6 neobrutalism-shadow ${className}`}>
      {title && (
        <div className="border-b-4 border-white pb-2 mb-4">
          <h3 className="text-2xl font-black uppercase tracking-tight">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default NeobrutalCard;
