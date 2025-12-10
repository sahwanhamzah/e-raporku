import React from 'react';

interface SectionWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`mb-8 ${className}`}>
      {/* Header Section Formal */}
      <div className="mb-4 border-b-2 border-gray-800 pb-1">
        <h3 className="font-heading font-bold text-lg text-black uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="pl-0">
        {children}
      </div>
    </div>
  );
};