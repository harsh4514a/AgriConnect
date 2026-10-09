'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AuthStep, AuthData, StepProps } from '@/types/auth-steps.types';

interface StepComponent {
    key: AuthStep;
    component: React.ComponentType<StepProps>;
}

interface AuthStepRendererProps {
    currentStep: AuthStep;
    steps: StepComponent[];
    authData: AuthData;
    onNext: (data?: Partial<AuthData>) => void;
    onBack: () => void;
    onComplete?: () => void;
}

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
        x: direction < 0 ? 300 : -300,
        opacity: 0,
    }),
};

export function AuthStepRenderer({
    currentStep,
    steps,
    authData,
    onNext,
    onBack,
    onComplete,
}: AuthStepRendererProps) {
    const activeStep = steps.find((s) => s.key === currentStep);
    const currentIndex = steps.findIndex((s) => s.key === currentStep);

    if (!activeStep) return null;

    const StepComponent = activeStep.component;

    return (
        <AnimatePresence mode="wait" custom={currentIndex}>
            <motion.div
                key={currentStep}
                custom={currentIndex}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
                <StepComponent
                    onNext={onNext}
                    onBack={onBack}
                    authData={authData}
                    onComplete={onComplete}
                />
            </motion.div>
        </AnimatePresence>
    );
}

