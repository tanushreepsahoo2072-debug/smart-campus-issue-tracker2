
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
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LoaderCircle, Mail, MapPin, PartyPopper, Paperclip, X } from 'lucide-react';
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
import { handleComplaintSubmission } from '@/app/lodge-complaint/actions';
import { useUser } from '@/firebase';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  location: z.string().min(1, 'Please fetch your GPS location.'),
  email: z.string().email('A valid email is required.'),
  createdBy: z.string().min(1, 'User ID is required.'),
  attachments: z
    .array(z.instanceof(File))
    .max(MAX_FILES, `You can only upload a maximum of ${MAX_FILES} files.`)
    .optional()
    .refine(
      (files) =>
        !files || files.every((file) => ALLOWED_FILE_TYPES.includes(file.type)),
      'Only .jpg, .jpeg, .png, .webp, and .gif formats are supported.'
    )
    .refine(
      (files) => !files || files.every((file) => file.size <= MAX_FILE_SIZE),
      `Each file size must be less than 5MB.`
    ),
});

type FormValues = z.infer<typeof formSchema>;

async function uploadImagesToImgbb(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  const IMGBB_API_KEY = 'c1fc19fa6575a721e6a1ee966f5ee216'; 

  for (const file of files) {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      urls.push(data.data.url);
    } else {
      throw new Error(data.error?.message || `Failed to upload ${file.name}.`);
    }
  }

  return urls;
}


export default function ComplaintForm() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedIssueId, setSubmittedIssueId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      email: '',
      createdBy: '',
      attachments: [],
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue('createdBy', user.uid);
      if (user.email) {
        form.setValue('email', user.email);
      }
    }
  }, [user, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const allFiles = [...selectedFiles, ...newFiles];
      if (allFiles.length > MAX_FILES) {
        toast({
          variant: 'destructive',
          title: 'Too many files',
          description: `You can only upload a maximum of ${MAX_FILES} files.`,
        });
        return;
      }
      setSelectedFiles(allFiles);
      form.setValue('attachments', allFiles, { shouldValidate: true });
    }
  };

  const removeFile = (indexToRemove: number) => {
    const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(updatedFiles);
    form.setValue('attachments', updatedFiles, { shouldValidate: true });
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
    setIsSubmitting(true);

    try {
      let imageUrls: string[] = [];
      if (values.attachments && values.attachments.length > 0) {
        toast({ title: 'Uploading images...', description: 'Please wait.' });
        imageUrls = await uploadImagesToImgbb(values.attachments);
      }

      const complaintData = {
        title: values.title,
        description: values.description,
        location: values.location,
        email: values.email,
        createdBy: values.createdBy,
        imageUrls,
      };
      
      const result = await handleComplaintSubmission(complaintData);

      if (result.success && result.issueId) {
        setSubmittedIssueId(result.issueId);
        setShowSuccessDialog(true);
        form.reset();
        setSelectedFiles([]);
      } else {
        throw new Error(result.error || 'An unknown error occurred.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="your.email@example.com" {...field} className="pl-10" readOnly disabled/>
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
                    <FormLabel>Attachments (Max 5 files, 5MB each)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Button type="button" asChild variant="outline">
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <Paperclip className="mr-2 h-4 w-4" />
                            Select Files
                          </label>
                        </Button>
                        <Input
                          id="file-upload"
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                          accept="image/*"
                        />
                      </div>
                    </FormControl>
                     {selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">Selected files:</h4>
                        <ul className="list-inside list-disc space-y-1">
                          {selectedFiles.map((file, index) => (
                            <li key={index} className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
