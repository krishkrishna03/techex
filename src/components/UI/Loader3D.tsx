import React from 'react';

interface Loader3DProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const Loader3D: React.FC<Loader3DProps> = ({
  size = 'md',
  message,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  };

  const dotSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin-slow">
            <div className="relative">
              <div className={`absolute ${dotSizeClasses[size]} bg-blue-500 rounded-full animate-pulse`}
                   style={{ top: '0%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              <div className={`absolute ${dotSizeClasses[size]} bg-blue-600 rounded-full animate-pulse`}
                   style={{ top: '50%', left: '100%', transform: 'translate(-50%, -50%)', animationDelay: '0.2s' }} />
              <div className={`absolute ${dotSizeClasses[size]} bg-blue-700 rounded-full animate-pulse`}
                   style={{ top: '100%', left: '50%', transform: 'translate(-50%, -50%)', animationDelay: '0.4s' }} />
              <div className={`absolute ${dotSizeClasses[size]} bg-blue-800 rounded-full animate-pulse`}
                   style={{ top: '50%', left: '0%', transform: 'translate(-50%, -50%)', animationDelay: '0.6s' }} />
            </div>
          </div>
        </div>

        <div className={`absolute inset-0 animate-ping opacity-20 ${sizeClasses[size]} bg-blue-400 rounded-full`} />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-bounce">
            <div className={`${dotSizeClasses[size]} bg-blue-500 rounded-full`} />
          </div>
        </div>
      </div>

      {message && (
        <div className="mt-6 text-center">
          <p className="text-gray-700 font-medium animate-pulse">{message}</p>
        </div>
      )}
    </div>
  );
};

export default Loader3D;
