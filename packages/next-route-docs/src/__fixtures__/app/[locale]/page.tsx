export async function generateStaticParams() {
    return [{ locale: 'en' }, { locale: 'de' }];
}

export default function HomePage() {
    return null;
}
