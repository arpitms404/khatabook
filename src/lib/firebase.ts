import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  UserCredential,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// User's web app Firebase configuration for FamilyKhata
export const firebaseConfig = {
  apiKey: "AIzaSyC36Md0SiPsdBDQwPZKohBup2PwHq5bQ1Y",
  authDomain: "familykhata-9c2a5.firebaseapp.com",
  projectId: "familykhata-9c2a5",
  storageBucket: "familykhata-9c2a5.firebasestorage.app",
  messagingSenderId: "226410466126",
  appId: "1:226410466126:web:ad02970203f10ee4a8ec1f",
  measurementId: "G-9YQVDTXTMV",
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Analytics if supported in the browser environment
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

// Initialize Firestore
export const db = getFirestore(app);

// Auth instance
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export type { ConfirmationResult, UserCredential, RecaptchaVerifier };

// RecaptchaVerifier helper for Firebase Phone Auth
export function getOrCreateRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  if (typeof window === 'undefined') {
    throw new Error('RecaptchaVerifier requires browser window');
  }
  const win = window as any;
  if (win.__recaptchaVerifier) {
    try {
      win.__recaptchaVerifier.clear();
    } catch {
      // ignore reset error
    }
    win.__recaptchaVerifier = null;
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA verified
    },
    'expired-callback': () => {
      console.warn('Firebase reCAPTCHA expired, will retry on next send');
    },
  });

  win.__recaptchaVerifier = verifier;
  return verifier;
}

// Phone OTP Send
export async function requestPhoneOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return await signInWithPhoneNumber(auth, phoneNumber, verifier);
}

// Phone OTP Confirm
export async function confirmOtpCode(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<UserCredential> {
  return await confirmationResult.confirm(code);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on initialization
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline mode. Please check Firebase configuration.');
      return false;
    }
    // Expected permission error or missing document is fine, it confirms online connectivity
    return true;
  }
}

testFirestoreConnection().catch(() => {});
