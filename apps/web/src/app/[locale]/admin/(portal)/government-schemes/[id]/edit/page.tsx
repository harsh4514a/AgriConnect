import { AdminGovernmentSchemes } from '@/components/admin/admin-government-schemes';

export default async function AdminEditGovernmentSchemePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <AdminGovernmentSchemes initialEditor={id} />;
}
