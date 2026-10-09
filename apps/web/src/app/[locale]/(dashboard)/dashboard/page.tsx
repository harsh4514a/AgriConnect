'use client';

import { useAuth } from '@/hooks/use-auth';
import { DashboardHome } from '@/components/dashboard/dashboard-home';

export default function DashboardPage() {
    const { user } = useAuth();
    return <DashboardHome user={user} />;
}
