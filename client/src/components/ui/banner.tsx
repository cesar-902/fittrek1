import React from 'react';

interface BannerProps {
  title: string;
  imageSrc: string;
}

export function Banner({ title, imageSrc }: BannerProps) {
  return (
    <div className="w-full bg-sky-200 rounded-lg shadow-md overflow-hidden mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between p-6">
        <div className="flex-1 text-center md:text-left mb-4 md:mb-0">
          <h2 className="text-4xl font-bold text-primary bg-gradient-to-r from-primary to-blue-700 text-transparent bg-clip-text">
            {title}
          </h2>
          <p className="text-sky-800 mt-2 text-lg">
            Acompanhe seu progresso e melhore seus resultados.
          </p>
        </div>
        <div className="flex-shrink-0 w-56 h-56 relative">
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}