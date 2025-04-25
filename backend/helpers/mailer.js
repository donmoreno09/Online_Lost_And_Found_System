import nodemailer from 'nodemailer';

// Configurazione del trasporto email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Funzione per inviare email
const sendMail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email inviata: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Errore nell\'invio dell\'email:', error);
    throw error;
  }
};

// Funzione di verifica della connessione
const verifyConnection = async () => {
  return transporter.verify();
};

const mailer = {
  sendMail,
  verifyConnection
};

export default mailer;