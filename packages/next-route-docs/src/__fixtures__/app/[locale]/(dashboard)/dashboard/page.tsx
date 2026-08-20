import { cookies } from 'next/headers';

export default async function DashboardPage() {
    await cookies();
    return null;
}
