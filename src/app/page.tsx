import dynamic from 'next/dynamic';

// Use dynamic import for client component with no SSR
const ClientPage = dynamic(() => import('@/components/organisms/Home'), {
  ssr: false
});

export default function Page() {
  return <ClientPage />;
} 