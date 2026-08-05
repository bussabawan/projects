import LoadingSpinner from "@/app/components/LoadingSpinner/LoadingSpinner";

export default function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', padding: '4rem' }}>
      <LoadingSpinner text="กำลังโหลดหน้าจอ..." />
    </div>
  );
}
