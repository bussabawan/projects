import Skeleton from "@/app/components/Skeleton/Skeleton";

export default function Loading() {
  return (
    <div style={{ width: '100%', padding: '4rem' }}>
      <Skeleton type="table" count={5} />
    </div>
  );
}
