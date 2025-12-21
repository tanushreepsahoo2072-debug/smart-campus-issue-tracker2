'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LoaderCircle, Mail, MapPin, Paperclip, PartyPopper, X } from 'lucide-react';
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  location: z.string().min(1, 'Please fetch your GPS location.'),
  email: z.string().email('A valid email is required.'),
  attachments: z
    .array(z.any())
    .min(1, 'At least one attachment is required.')
    .refine(
      (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
      `Each file size should not exceed 5MB.`
    )
    .refine(
      (files) => files.every((file) => ALLOWED_IMAGE_TYPES.includes(file.type)),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    ),
});

type FormValues = z.infer<typeof formSchema>;

export default function ComplaintForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedIssueId, setSubmittedIssueId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const attachmentFileRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      email: '',
      attachments: [],
    },
  });

  useEffect(() => {
    form.setValue('attachments', selectedFiles, { shouldValidate: true });
  }, [selectedFiles, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files ? Array.from(event.target.files) : [];
    if (newFiles.length > 0) {
      setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
    // Reset file input to allow selecting the same file again
    if (attachmentFileRef.current) {
      attachmentFileRef.current.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
  };


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
    // All submission logic has been removed.
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GPS Location</FormLabel>
                    <div className="flex flex-wrap items-center gap-4">
                      <Button type="button" onClick={handleFetchLocation} disabled={isFetchingLocation}>
                        {isFetchingLocation ? (
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="mr-2 h-4 w-4" />
                        )}
                        Fetch Location
                      </Button>
                      {field.value && (
                        <span className="text-sm font-medium text-muted-foreground">
                          {field.value}
                        </span>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attachments"
                render={() => (
                  <FormItem>
                    <FormLabel>Attachments</FormLabel>
                    <div className="flex flex-col gap-2">
                       <Button type="button" onClick={() => attachmentFileRef.current?.click()} className="w-fit">
                          <Paperclip className="mr-2 h-4 w-4" />
                          Add Attachment(s)
                        </Button>
                      <FormControl>
                          <Input
                            type="file"
                            className="hidden"
                            ref={attachmentFileRef}
                            onChange={handleFileChange}
                            accept={ALLOWED_IMAGE_TYPES.join(',')}
                            multiple
                          />
                      </FormControl>
                      
                       <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between rounded-md border bg-muted p-2 text-sm">
                            <span className="truncate pr-2">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRemoveFile(index)}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Remove file</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
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
