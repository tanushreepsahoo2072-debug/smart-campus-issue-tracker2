import TrackComplaint from '@/components/track-complaint';

export default function TrackStatusPage() {
  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Track Your Complaint</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your Tracking PIN below to see the current status of your issue.
        </p>
      </div>
      <TrackComplaint />
    </div>
  );
}
