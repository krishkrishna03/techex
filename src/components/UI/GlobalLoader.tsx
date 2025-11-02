import React from 'react';
import Loader3D from './Loader3D';
import { useLoading } from '../../contexts/LoadingContext';

const GlobalLoader: React.FC = () => {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <Loader3D size="lg" message={loadingMessage} />
      </div>
    </div>
  );
};

export default GlobalLoader;
