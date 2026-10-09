import { AdminCropGuides } from '@/components/admin/admin-crop-guides';

export default async function AdminEditCropGuidePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <AdminCropGuides initialEditor={id} />;
}
