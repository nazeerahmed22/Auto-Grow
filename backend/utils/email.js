const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

async function sendTaskNotification({ to, subject, taskTitle, projectName, assigneeName, dueDate, message }) {
  if (!process.env.SMTP_USER) return; // skip if not configured
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#6366f1;padding:20px;border-radius:8px 8px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">Auto-Grow</h1>
      </div>
      <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 8px 8px">
        <h2 style="color:#1e293b">${subject}</h2>
        <p style="color:#475569">${message}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#64748b;font-weight:600">Task</td><td style="padding:8px;color:#1e293b">${taskTitle}</td></tr>
          <tr style="background:#f1f5f9"><td style="padding:8px;color:#64748b;font-weight:600">Project</td><td style="padding:8px;color:#1e293b">${projectName}</td></tr>
          ${assigneeName ? `<tr><td style="padding:8px;color:#64748b;font-weight:600">Assigned To</td><td style="padding:8px;color:#1e293b">${assigneeName}</td></tr>` : ''}
          ${dueDate ? `<tr style="background:#f1f5f9"><td style="padding:8px;color:#64748b;font-weight:600">Due Date</td><td style="padding:8px;color:#1e293b">${dueDate}</td></tr>` : ''}
        </table>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Auto-Grow Project Management • You received this because you are assigned to or watching this task.</p>
      </div>
    </div>
  `;
  try {
    await transporter.sendMail({ from: `"Auto-Grow" <${process.env.SMTP_USER}>`, to, subject, html });
  } catch (e) {
    console.error('[EMAIL] Failed to send:', e.message);
  }
}

module.exports = { sendTaskNotification };
