import { Complaint } from '@/types/complaint';
declare const html2pdf: any;

export const generateComplaintPDF = (complaint: Complaint) => {
  const element = document.createElement('div');
  element.style.display = 'block';

  element.innerHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Smart Campus Issue Report</title>

<style>
  body {
    font-family: Arial, sans-serif;
    background: #ffffff;
    padding: 20px;
  }

  .container {
    max-width: 850px;
    margin: auto;
    padding: 30px;
    border: 1px solid #ccc;
  }

  .header {
    text-align: center;
    margin-bottom: 25px;
    border-bottom: 2px solid #000;
    padding-bottom: 15px;
  }

  .header img {
    height: 80px;
    margin-bottom: 10px;
  }

  .row {
    margin-bottom: 10px;
    font-size: 14px;
    line-height: 1.6;
  }

  .label {
    font-weight: bold;
    display: inline-block;
    width: 220px;
    vertical-align: top;
  }

  .value {
    display: inline-block;
    width: calc(100% - 230px);
  }

  .images img {
    max-width: 160px;
    margin: 5px;
    border: 1px solid #aaa;
  }

  .footer {
    margin-top: 40px;
    font-size: 12px;
    text-align: right;
  }
</style>
</head>

<body>

<div class="container">

  <div class="header">
    <img src="/civicconnect-logo.png" />
    <h2>Smart Campus Issue Report</h2>
  </div>

  <div class="row">
    <span class="label">Uploaded Images:</span>
    <span class="value images">
      ${(complaint.imageUrls || [])
        .map(
          (url) =>
            `<img src="${url}" crossorigin="anonymous" />`
        )
        .join('')}
    </span>
  </div>

  <hr />

  <div class="row"><span class="label">Complaint ID:</span><span class="value">${complaint.id}</span></div>
  <div class="row"><span class="label">Title:</span><span class="value">${complaint.title}</span></div>
  <div class="row"><span class="label">Description:</span><span class="value">${complaint.description}</span></div>

  <div class="row"><span class="label">Category:</span><span class="value">${complaint.category}</span></div>
  <div class="row"><span class="label">Current Status:</span><span class="value">${complaint.currentStatus}</span></div>
  <div class="row"><span class="label">Assigned To:</span><span class="value">${complaint.assignedTo || '-'}</span></div>

  <div class="row"><span class="label">Latitude:</span><span class="value">${complaint.latitude}</span></div>
  <div class="row"><span class="label">Longitude:</span><span class="value">${complaint.longitude}</span></div>

  <div class="row"><span class="label">Filed By:</span><span class="value">${complaint.email}</span></div>
  <div class="row"><span class="label">Frequency:</span><span class="value">${complaint.frequency}</span></div>

  <div class="row"><span class="label">Created At:</span><span class="value">${new Date(
    complaint.createdAt
  ).toLocaleString()}</span></div>

  <div class="row"><span class="label">Updated At:</span><span class="value">${new Date(
    complaint.updatedAt
  ).toLocaleString()}</span></div>

  <hr />

  <h3>AI Analysis</h3>

  <div class="row"><span class="label">AI Priority:</span><span class="value">${complaint.ai_priority}</span></div>
  <div class="row"><span class="label">Is Spam:</span><span class="value">${complaint.is_spam ? 'Yes' : 'No'}</span></div>
  <div class="row"><span class="label">AI Comment:</span><span class="value">${complaint.AI_COMMENT || '-'}</span></div>

  <hr />

  <h3>Administrative Remarks</h3>
  <div class="row">
    <span class="label">Admin Comment:</span>
    <span class="value">${complaint.admin_comments || '-'}</span>
  </div>

  <div class="footer">
    <p>Authority Signature: ________________________</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>

</div>

</body>
</html>
`;

  document.body.appendChild(element);

  html2pdf()
    .set({
      margin: 10,
      filename: `Complaint-${complaint.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(element)
    .save()
    .finally(() => {
      document.body.removeChild(element);
    });
};
