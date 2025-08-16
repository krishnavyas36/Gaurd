import React from 'react';

interface WalletGydeLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export default function WalletGydeLogo({ className = "", variant = 'light' }: WalletGydeLogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-gray-900';
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo Icon - Wallet/Card with arrow/guide element */}
      <div className="relative">
        <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Main wallet/card body */}
          <rect 
            x="2" 
            y="6" 
            width="24" 
            height="16" 
            rx="3" 
            fill="#34D399" 
            className="drop-shadow-sm"
          />
          {/* Card detail line */}
          <rect 
            x="6" 
            y="12" 
            width="12" 
            height="2" 
            rx="1" 
            fill="white" 
            opacity="0.8"
          />
          {/* Gyde arrow/guide element */}
          <path 
            d="M20 2L28 6L24 8L28 10L20 14" 
            stroke="#60A5FA" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
          />
        </svg>
      </div>
      
      {/* Logo Text */}
      <div className={`font-bold text-lg ${textColor}`}>
        <span className="text-emerald-400">WALLET</span>
        <span className={variant === 'light' ? 'text-blue-300' : 'text-blue-600'}>GYDE</span>
      </div>
    </div>
  );
}