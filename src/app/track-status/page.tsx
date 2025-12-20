import UserComplaints from '@/components/user-complaints';

export default function TrackStatusPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Your Complaints</h1>
        <p className="mt-2 text-muted-foreground">
          Here are all the issues you have reported.
        </p>
      </div>
      <UserComplaints />
    </div>
  );
}
