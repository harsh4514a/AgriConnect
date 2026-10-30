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
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground">
                        {leftIcon}
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        'flex h-11 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground',
                        'placeholder:text-muted-foreground',
                        'transition-colors duration-150',
                        'focus-visible:outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/20',
                        'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface-subtle',
                        error
                            ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20'
                            : 'hover:border-border-strong',
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
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground">
                        {rightIcon}
                    </div>
                )}
            </div>
        );
    },
);
Input.displayName = 'Input';

export { Input };

