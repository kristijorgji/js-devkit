export const revalidate = 3600;

export async function generateStaticParams() {
    return [{ locale: 'en', slug: 'hello' }];
}

export default function PostPage() {
    return null;
}
