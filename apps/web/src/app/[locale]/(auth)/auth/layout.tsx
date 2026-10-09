import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login | AgriConnect',
    description: 'Enter your mobile number to login to AgriConnect',
    robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
