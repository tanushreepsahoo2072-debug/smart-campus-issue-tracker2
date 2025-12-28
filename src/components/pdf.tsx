
import {Complaint} from '@/types/complaint';
declare const html2pdf: any;
export const generateComplaintPDF = (Complaint:Complaint) => {
  // Hidden div create dynamically (DOM me add aur remove karenge)
  const element = document.createElement('div');
  element.style.display = 'block'; // invisible but still renders in memory
  element.innerHTML = `
    <div style="padding:20px; font-family: Arial, sans-serif;">
      <div style="text-align:center; margin-bottom:20px;">
        <img src="/civicconnect-logo.png" style="height:50px;" />
        <h2>Complaint/Issue Form</h2>
      </div>

      <div style="line-height:1.6; font-size:14px;">
        <p><strong>Complaint ID:</strong> ${Complaint.id}</p>
        <p><strong>Title:</strong> ${Complaint.title}</p>
        <p><strong>Status:</strong> ${Complaint.currentStatus}</p>
        <p><strong>Priority:</strong> ${Complaint.ai_priority}</p>
        <p><strong>Description:</strong> ${Complaint.description}</p>
        <p><strong>Filed By:</strong> ${Complaint.email}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>

      <div style="text-align:right; margin-top:40px; font-size:12px;">
        <p>Authority Signature: ____________________</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    </div>
  `;

  document.body.appendChild(element); // temporarily add to DOM

  html2pdf()
    .set({
      margin: 10,
      filename: `Complaint-${Complaint.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, logging: true, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(element)
    .save()
    .finally(() => {
      document.body.removeChild(element); // remove after PDF generation
    });
};
