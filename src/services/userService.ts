import { db } from '../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { BankData } from '../stores/userStore';

interface UserBankData {
  bankData: BankData[];
}

class UserService {
  private validateBankData(data: any): void {
    if (!data || !Array.isArray(data.bankData)) {
      throw new Error('Formato de datos inválido');
    }

    data.bankData.forEach((bank: Partial<BankData>) => {
      if (!bank.id || !bank.uid || !bank.bankName || !bank.accountNumber) {
        throw new Error('Datos bancarios incompletos');
      }
    });
  }

  async updateUserBankData(uid: string, data: UserBankData): Promise<void> {
    try {
      if (!uid) throw new Error('UID de usuario requerido');
      
      this.validateBankData(data);

      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, {
        ...data,
        updatedAt: new Date(),
      }, { merge: true });

    } catch (error) {
      console.error("Error actualizando datos bancarios:", error);
      throw error;
    }
  }

  async getUserBankData(uid: string): Promise<UserBankData | null> {
    try {
      if (!uid) throw new Error('UID de usuario requerido');

      const userDocRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userDocRef);
      
      if (!docSnap.exists()) return null;

      const data = docSnap.data() as UserBankData;
      this.validateBankData(data);
      
      return data;

    } catch (error) {
      console.error("Error obteniendo datos bancarios:", error);
      throw error;
    }
  }
}

export default new UserService();
