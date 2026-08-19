import dynamic from 'next/dynamic';

const MemoryCategoryClient = dynamic(() => import('./MemoryCategoryClient'));

export default function MemoryCategoryPage() {
  return <MemoryCategoryClient />;
}
