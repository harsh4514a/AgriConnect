import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
    {
        variants: {
            variant: {
                primary:
                    'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 active:translate-y-0',
                secondary:
                    'bg-white text-brand-800 border-2 border-brand-200 hover:border-brand-300 hover:bg-brand-50 active:bg-brand-100',
                outline:
                    'border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100',
                ghost:
                    'text-gray-600 hover:bg-gray-100 active:bg-gray-200',
                link:
                    'text-brand-700 underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-12 px-6 py-3',
                sm: 'h-10 px-4 py-2 text-xs',
                lg: 'h-14 px-8 py-4 text-base',
                xl: 'h-16 px-10 py-5 text-lg',
                icon: 'h-10 w-10',
            },
            fullWidth: {
                true: 'w-full',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'default',
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, fullWidth, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };

