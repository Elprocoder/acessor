import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

export async function sendEmailNotification(userId, subject, message) {
  try {
    const sendEmail = httpsCallable(functions, 'sendEmail');
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      await sendEmail({
        email: userData.email,
        subject,
        message
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}
