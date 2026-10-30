import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 select-none',
    {
        variants: {
            variant: {
                primary:
                    'bg-accent text-accent-foreground hover:bg-accent-strong',
                secondary:
                    'border border-border bg-accent-soft text-accent-strong hover:border-border-strong hover:bg-surface-subtle',
                outline:
                    'border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-subtle',
                ghost:
                    'text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
                link:
                    'text-accent underline-offset-4 hover:text-accent-strong hover:underline',
            },
            size: {
                default: 'h-11 px-5 py-2.5',
                sm: 'h-9 px-3.5 py-2 text-xs',
                lg: 'h-12 px-6 py-3 text-base',
                xl: 'h-14 px-8 py-4 text-base',
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

