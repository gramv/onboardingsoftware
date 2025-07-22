import React from 'react';
import { cn } from '../../utils/cn';
import { Icon } from './Icon';

export interface MagicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    variant?: 'default' | 'compact';
    position?: 'absolute' | 'relative';
    size?: 'sm' | 'md';
}

const MagicButton = React.forwardRef<HTMLButtonElement, MagicButtonProps>(
    ({
        className,
        loading = false,
        variant = 'default',
        position = 'absolute',
        size = 'md',
        disabled,
        children,
        ...props
    }, ref) => {
        const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed group';

        const variantClasses = {
            default: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95',
            compact: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95',
        };

        const sizeClasses = {
            sm: variant === 'compact' ? 'w-6 h-6 p-1' : 'px-3 py-1.5 text-xs',
            md: variant === 'compact' ? 'w-8 h-8 p-1.5' : 'px-4 py-2 text-sm',
        };

        const positionClasses = position === 'absolute'
            ? 'absolute right-2 bottom-2 z-10'
            : '';

        // Magic sparkle animation keyframes are defined in globals.css
        const magicEffectClasses = 'before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-purple-400 before:to-pink-400 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-20 before:animate-pulse';

        return (
            <button
                className={cn(
                    baseClasses,
                    variantClasses[variant],
                    sizeClasses[size],
                    positionClasses,
                    magicEffectClasses,
                    loading && 'cursor-not-allowed animate-pulse',
                    className
                )}
                disabled={disabled || loading}
                ref={ref}
                {...props}
            >
                <div className="relative z-10 flex items-center justify-center">
                    {loading ? (
                        <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {variant === 'default' && size === 'md' && (
                                <span className="text-xs">AI</span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center space-x-1">
                            {/* Magic wand icon with sparkle effect */}
                            <div className="relative">
                                <Icon name="Wand2" className={cn(
                                    "transition-transform duration-300 group-hover:rotate-12",
                                    size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
                                )} />
                                {/* Sparkle effects */}
                                <div className="absolute -top-1 -right-1 w-1 h-1 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping" />
                                <div className="absolute -bottom-1 -left-1 w-0.5 h-0.5 bg-yellow-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                            </div>
                            {variant === 'default' && (
                                <span className={cn(
                                    "font-semibold tracking-wide",
                                    size === 'sm' ? 'text-xs' : 'text-sm'
                                )}>
                                    {children || 'AI'}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-sm -z-10" />

                {/* Elegant floating tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-50">
                    ✨ Enhance with AI
                    <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            </button>
        );
    }
);

MagicButton.displayName = 'MagicButton';

export { MagicButton };