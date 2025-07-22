import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { tablet } from '../../../styles/design-tokens';

interface Language {
  code: 'en' | 'es';
  name: string;
  nativeName: string;
  flag: string;
  audioUrl?: string;
}

interface LanguageSelectionProps {
  onLanguageSelect: (language: Language['code']) => void;
  selectedLanguage?: Language['code'];
  className?: string;
  highContrast?: boolean;
  largeText?: boolean;
}

const languages: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    audioUrl: '/audio/english-pronunciation.mp3'
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    audioUrl: '/audio/spanish-pronunciation.mp3'
  }
];

export const LanguageSelection: React.FC<LanguageSelectionProps> = ({
  onLanguageSelect,
  selectedLanguage,
  className = '',
  highContrast = false,
  largeText = false
}) => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const playPronunciation = async (language: Language) => {
    if (!language.audioUrl) return;
    
    try {
      setPlayingAudio(language.code);
      const audio = new Audio(language.audioUrl);
      audio.onended = () => setPlayingAudio(null);
      await audio.play();
    } catch (error) {
      console.log('Audio playback not available:', error);
      setPlayingAudio(null);
    }
  };

  const handleLanguageSelect = (language: Language) => {
    onLanguageSelect(language.code);
  };

  return (
    <div className={`w-full max-w-2xl mx-auto p-6 ${className}`}>
      <div className="text-center mb-8">
        <h1 className={`font-bold mb-4 ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-5xl' : 'text-4xl'}`}>
          Welcome / Bienvenido
        </h1>
        <p className={`mb-2 ${highContrast ? 'text-white' : 'text-gray-600'} ${largeText ? 'text-2xl' : 'text-xl'}`}>
          Please select your preferred language
        </p>
        <p className={`${highContrast ? 'text-white' : 'text-gray-600'} ${largeText ? 'text-2xl' : 'text-xl'}`}>
          Por favor seleccione su idioma preferido
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {languages.map((language) => {
          const isSelected = selectedLanguage === language.code;
          const isPlaying = playingAudio === language.code;
          
          return (
            <Card
              key={language.code}
              className={`
                relative cursor-pointer transition-all duration-200 hover:scale-105
                ${isSelected 
                  ? highContrast
                    ? 'ring-4 ring-white bg-gray-800 border-white' 
                    : 'ring-4 ring-primary-500 bg-primary-50 border-primary-200'
                  : highContrast
                    ? 'hover:border-white hover:bg-gray-800'
                    : 'hover:border-primary-300 hover:shadow-lg'
                }
                ${highContrast ? 'bg-black text-white border-gray-600' : ''}
              `}
              onClick={() => handleLanguageSelect(language)}
              role="button"
              aria-pressed={isSelected}
              aria-label={`Select ${language.name} language`}
            >
              <div className="p-8 text-center">
                {/* Large Flag */}
                <div 
                  className="mb-4 select-none"
                  style={{ 
                    fontSize: largeText ? tablet.onboarding.languageFlag.size * 1.2 : tablet.onboarding.languageFlag.size,
                    lineHeight: 1
                  }}
                  role="img"
                  aria-label={`${language.name} flag`}
                >
                  {language.flag}
                </div>

                {/* Language Names */}
                <h3 className={`font-semibold mb-2 ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-3xl' : 'text-2xl'}`}>
                  {language.nativeName}
                </h3>
                <p className={`mb-4 ${highContrast ? 'text-gray-300' : 'text-gray-600'} ${largeText ? 'text-xl' : 'text-lg'}`}>
                  {language.name}
                </p>

                {/* Audio Pronunciation Button */}
                {language.audioUrl && (
                  <Button
                    variant={highContrast ? "primary" : "ghost"}
                    size={largeText ? "lg" : "sm"}
                    onClick={(e) => {
                      e.stopPropagation();
                      playPronunciation(language);
                    }}
                    disabled={isPlaying}
                    className={`mb-4 ${highContrast ? '' : 'text-primary-600 hover:text-primary-700'}`}
                    aria-label={`Listen to ${language.name} pronunciation`}
                  >
                    <span className="flex items-center gap-2">
                      {isPlaying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          {largeText ? 'Playing Audio...' : 'Playing...'}
                        </>
                      ) : (
                        <>
                          🔊 {largeText ? 'Listen to Pronunciation' : 'Listen'}
                        </>
                      )}
                    </span>
                  </Button>
                )}

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className={`w-8 h-8 ${highContrast ? 'bg-white text-black' : 'bg-primary-500 text-white'} rounded-full flex items-center justify-center`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Continue Button */}
      {selectedLanguage && (
        <div className="mt-8 text-center">
          <Button
            size={largeText ? "lg" : "md"}
            className={`px-12 py-4 ${largeText ? 'text-xl' : 'text-lg'} font-semibold`}
            onClick={() => {
              // This will be handled by the parent wizard component
              console.log('Continue with language:', selectedLanguage);
            }}
          >
            {selectedLanguage === 'es' ? 'Continuar' : 'Continue'}
            <svg className={`${largeText ? 'w-6 h-6' : 'w-5 h-5'} ml-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
};

export default LanguageSelection;