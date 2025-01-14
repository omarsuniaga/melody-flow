import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, updatePassword as firebaseUpdatePassword, sendPasswordResetEmail, onAuthStateChanged as firebaseOnAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../firebase/config';
export function useAuthService() {
    async function login(email, password) {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        return user;
    }
    async function register(email, password, displayName) {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName });
        return user;
    }
    async function logout() {
        await signOut(auth);
    }
    async function updatePassword(currentPassword, newPassword) {
        const user = auth.currentUser;
        if (!user?.email)
            throw new Error('No authenticated user');
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await firebaseUpdatePassword(user, newPassword);
    }
    async function resetPassword(email) {
        await sendPasswordResetEmail(auth, email);
    }
    function onAuthStateChanged(callback) {
        return firebaseOnAuthStateChanged(auth, callback);
    }
    function validatePassword(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    return {
        login,
        register,
        logout,
        updatePassword,
        resetPassword,
        onAuthStateChanged,
        validatePassword,
        validateEmail
    };
}
