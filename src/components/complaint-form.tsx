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
import { useState, useRef, useEffect } from 'react';
import { handleComplaintSubmission } from '@/app/lodge-complaint/actions';
import { Card, CardContent } from '@/components/ui/card';
import { LoaderCircle, Mail, MapPin, Paperclip, PartyPopper } from 'lucide-react';
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
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  location: z.string().min(1, 'Please fetch your GPS location.'),
  email: z.string().email('A valid email is required.'),
  complaintImage: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, 'An attachment is required.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ComplaintForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedIssueId, setSubmittedIssueId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      email: '',
    },
  });

  const complaintImageRef = form.register('complaintImage');

  const handleFetchLocation = () => {
    setIsFetchingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `${latitude}, ${longitude}`;
          form.setValue('location', locationString, { shouldValidate: true });
          setIsFetchingLocation(false);
          toast({
            title: 'Location Fetched',
            description: `Coordinates: ${locationString}`,
          });
        },
        (error) => {
          console.error(error);
          form.setError('location', {
            type: 'manual',
            message: 'Could not get location. Please enable location services.',
          });
          toast({
            variant: 'destructive',
            title: 'Location Error',
            description: 'Could not get location. Please enable location services in your browser.',
          });
          setIsFetchingLocation(false);
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
      setIsFetchingLocation(false);
    }
  };
  
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('description', values.description);
    formData.append('location', values.location);
    formData.append('email', values.email);
    if (values.complaintImage && values.complaintImage.length > 0) {
      formData.append('complaintImage', values.complaintImage[0]);
    }

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

  const selectedFile = form.watch('complaintImage');

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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="your.email@example.com" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={() => (
                  <FormItem>
                    <FormLabel>GPS Location</FormLabel>
                    <div className="flex items-center gap-4">
                      <Button type="button" onClick={handleFetchLocation} disabled={isFetchingLocation}>
                        {isFetchingLocation ? (
                           <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                           <MapPin className="mr-2 h-4 w-4" />
                        )}
                        Fetch Location
                      </Button>
                      {form.getValues('location') && (
                        <span className="text-sm font-medium text-muted-foreground">
                          {form.getValues('location')}
                        </span>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complaintImage"
                render={() => (
                  <FormItem>
                    <FormLabel>Attachment</FormLabel>
                    <div className="flex min-h-[40px] items-center gap-4">
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="mr-2 h-4 w-4" />
                        Add Attachment
                      </Button>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        {...complaintImageRef}
                        ref={fileInputRef}
                      />
                      {selectedFile?.[0] && (
                        <span className="flex-1 text-sm text-muted-foreground">{selectedFile[0].name}</span>
                      )}
                    </div>
                    <FormDescription>Attach a photo of the issue.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
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
