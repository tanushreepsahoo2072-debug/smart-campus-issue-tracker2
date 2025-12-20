# **App Name**: CivicConnect

## Core Features:

- Complaint Submission: Allow users to submit complaints with title, description, and images, capturing GPS coordinates automatically.
- Automatic Category and Priority Tagging: Use the Gemini API to automatically categorize and prioritize complaints based on their descriptions. This will incorporate external knowledge and reasoning as a tool to arrive at these categories.
- Image Uploads: Enable camera-only uploads for complaint images and ID proof using the capture attribute.
- Data Submission to Google Sheets: Send complaint data to a Google Apps Script web app, which appends the data as a new row in the specified Google Sheet (https://docs.google.com/spreadsheets/d/1F-iVo6kb1FrFQlfT0oj5ilWewsYdXtdJ-eKIUH5ojfU/edit).
- Complaint Tracking: Provide a tracking page where users can enter their issueId to view the status of their complaint.
- User Authentication: Implement a basic login page for administrators or internal staff.
- Issue ID Generation and Display: Upon successful submission, display a modal with a unique issueId for tracking.

## Style Guidelines:

- Primary color: Indigo (#667EEA) to convey trust and reliability.
- Background color: Light gray (#F7FAFC), almost white, for a clean, modern look.
- Accent color: Soft Blue (#90CDF4) to complement indigo, and draw attention to important CTAs.
- Body and headline font: 'Inter', a grotesque-style sans-serif font with a modern and neutral look.
- Use clear, simple icons from a consistent set to represent different complaint categories and status indicators.
- Utilize a responsive layout with soft shadows and rounded-2xl corners for a modern 'Tech Startup' aesthetic, as the user requested.
- Employ subtle animations and transitions to enhance user experience and provide feedback, such as loading spinners and confirmation messages.