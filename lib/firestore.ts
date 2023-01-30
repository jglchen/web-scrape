import admin from 'firebase-admin';
import getConfig from "next/config";
const { serverRuntimeConfig } = getConfig();

const serviceAccount: any =
{
  "type": "service_account",
  "project_id": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  "private_key_id": process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY_ID,
  "private_key": serverRuntimeConfig.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  "client_email": serverRuntimeConfig.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.NEXT_PUBLIC_FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.NEXT_PUBLIC_FIREBASE_CERT_URL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}  

export default admin.firestore();
