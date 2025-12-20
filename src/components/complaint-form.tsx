'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { handleComplaintSubmission } from '@/app/lodge-complaint/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, LoaderCircle, MapPin, PartyPopper } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';

const formSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters.'),
  description: z.string().min(25, 'Description must be at least 25 characters.'),
  location: z.string().min(1, 'Could not get location. Please enable location services.'),
  complaintImage: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, 'Complaint image is required.'),
  idProofImage: z.instanceof(FileList).refine((files) => files?.length === 1, 'ID proof is required.'),
});

type FormValues = z.infer<typeof formSchema>;

function FileUploadField({
  form,
  name,
  label,
  description,
}: {
  form: any;
  name: keyof FormValues;
  label: string;
  description: string;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = form.register(name);

  return (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
                <Camera className="mr-2 h-4 w-4" />
                {fileName || 'Click to open camera'}
              </Button>
              <Input
                type="file"
                accept="image/*"
                capture="environment"
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                {...fileRef}
                onChange={(e) => {
                  fileRef.onChange(e);
                  setFileName(e.target.files?.[0]?.name || null);
                }}
              />
            </div>
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default function ComplaintForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedIssueId, setSubmittedIssueId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
    },
  });

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue('location', `${latitude}, ${longitude}`);
        },
        (error) => {
          console.error(error);
          form.setError('location', {
            type: 'manual',
            message: 'Could not get location. Please enable location services and refresh.',
          });
          toast({
            variant: 'destructive',
            title: 'Location Error',
            description: 'Could not get location. Please enable location services in your browser.',
          });
        }
      );
    } else {
      form.setError('location', {
        type: 'manual',
        message: 'Geolocation is not supported by your browser.',
      });
      toast({
        variant: 'destructive',
        title: 'Location Error',
        description: 'Geolocation is not supported by your browser.',
      });
    }
  }, [form, toast]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.keys(values).forEach((key) => {
      if (key === 'complaintImage' || key === 'idProofImage') {
        formData.append(key, values[key][0]);
      } else {
        formData.append(key, values[key as keyof Omit<FormValues, 'complaintImage' | 'idProofImage'>]);
      }
    });

    try {
      const result = await handleComplaintSubmission(formData);

      if (result.success && result.issueId) {
        setSubmittedIssueId(result.issueId);
        setShowSuccessDialog(true);
        form.reset();
      } else {
        throw new Error(result.error || 'An unknown error occurred.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Card className="rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complaint Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Large pothole on Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide as much detail as possible."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GPS Location</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Fetching location..." {...field} readOnly className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FileUploadField
                form={form}
                name="complaintImage"
                label="Complaint Image"
                description="Use your camera to take a photo of the issue."
              />

              <FileUploadField
                form={form}
                name="idProofImage"
                label="ID Proof"
                description="Use your camera to take a photo of your ID for verification."
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Complaint'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center">
              <PartyPopper className="h-12 w-12 text-green-500" />
            </div>
            <AlertDialogTitle className="text-center">Complaint Submitted!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Your complaint has been successfully submitted. Please save your Tracking PIN.
            </AlertDialogDescription>
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">Your Tracking PIN is:</p>
              <p className="text-2xl font-bold tracking-widest text-primary">{submittedIssueId}</p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction asChild>
              <Link href="/track-status">Track Status</Link>
            </AlertDialogAction>
            <AlertDialogAction asChild variant="outline" onClick={() => setShowSuccessDialog(false)}>
              <button>Close</button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
