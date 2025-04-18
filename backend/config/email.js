import sgMail from '@sendgrid/mail';

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Function to send email
export const sendEmail = async (to, subject, text, html) => {
  const msg = {
    to,
    from: process.env.EMAIL_FROM || 'notifications@lostandfound.com',
    subject,
    text,
    html
  };

  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Predefined email templates
export const sendFoundItemNotification = async (user, item) => {
  const subject = `Someone found an item similar to what you lost: ${item.title}`;
  const text = `Hello ${user.firstName}, someone has found an item that matches the description of what you reported as lost. Please check your dashboard for more details.`;
  const html = `
    <h1>Potential Match Found</h1>
    <p>Hello ${user.firstName},</p>
    <p>Good news! Someone has found an item that matches the description of what you reported as lost.</p>
    <p><strong>Item:</strong> ${item.title}</p>
    <p><strong>Found on:</strong> ${new Date(item.date).toLocaleDateString()}</p>
    <p>Please log in to your account to see more details and contact the finder.</p>
    <a href="${process.env.FRONTEND_URL}/my-items" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">View Details</a>
  `;

  return sendEmail(user.email, subject, text, html);
};

export const sendItemClaimedNotification = async (user, item) => {
  const subject = `Your item has been claimed: ${item.title}`;
  const text = `Hello ${user.firstName}, someone has claimed the item you found. Please check your dashboard for more details.`;
  const html = `
    <h1>Item Claimed</h1>
    <p>Hello ${user.firstName},</p>
    <p>Someone has claimed the item you reported as found:</p>
    <p><strong>Item:</strong> ${item.title}</p>
    <p>Please log in to your account to see more details and coordinate the return.</p>
    <a href="${process.env.FRONTEND_URL}/my-items" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">View Details</a>
  `;

  return sendEmail(user.email, subject, text, html);
};