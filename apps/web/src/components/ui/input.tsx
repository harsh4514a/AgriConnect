import * as React from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, leftIcon, rightIcon, ...props }, ref) => {
        return (
            <div className="relative">
                {leftIcon && (
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        'flex h-14 w-full rounded-xl border-2 bg-white px-4 py-3 text-base',
                        'placeholder:text-gray-400',
                        'transition-all duration-200',
                        'focus-visible:outline-none focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/10',
                        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
                        error
                            ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/10'
                            : 'border-gray-200 hover:border-gray-300',
                        leftIcon && 'pl-12',
                        rightIcon && 'pr-12',
                        className,
                    )}
                    ref={ref}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${props.id}-error` : undefined}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                        {rightIcon}
                    </div>
                )}
            </div>
        );
    },
);
Input.displayName = 'Input';

export { Input };

