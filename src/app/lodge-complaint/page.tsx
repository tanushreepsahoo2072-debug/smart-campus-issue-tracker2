import IssueForm from '@/components/issue-form';

export default function LodgeComplaintPage() {
  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Lodge a New Complaint</h1>
        <p className="mt-2 text-muted-foreground">
          Fill out the form below to report an issue in your community.
        </p>
      </div>
      <IssueForm />
    </div>
  );
}
