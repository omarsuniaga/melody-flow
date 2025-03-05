import { defineStore } from 'pinia';
import { ref } from 'vue';
import userService from '../services/userService';
import { auth } from '../firebase/config';

export interface BankData {
  id: string;
  uid: string;           // Relaciona el registro con el usuario autenticado
  bankName: string;
  accountNumber: string;
  idNumber: string;      // Número de cédula o pasaporte
  fullName: string;
  email: string;
  phone: string;
  active: boolean;       // Indica si es la cuenta activa
  createdAt?: Date;
  updatedAt?: Date;
}

export const useUserStore = defineStore('user', () => {
  const uid = ref('');
  const email = ref('');
  const fullName = ref('');
  const bankData = ref<BankData[]>([]);

  const setUserAuthData = (user: { uid: string; email: string; displayName?: string }) => {
    uid.value = user.uid;
    email.value = user.email;
    fullName.value = user.displayName || '';
  };

  const setBankData = (data: BankData[]) => {
    bankData.value = data;
  };

  const saveBankRecord = async (record: Partial<BankData>): Promise<void> => {
    if (!uid.value) {
      throw new Error('El usuario no está autenticado.');
    }

    // Validación de datos
    if (!record.bankName?.trim() || !record.accountNumber?.trim()) {
      throw new Error('Datos bancarios incompletos');
    }

    const sanitizedRecord: BankData = {
      id: record.id || crypto.randomUUID(),
      uid: uid.value,
      bankName: record.bankName.trim(),
      accountNumber: record.accountNumber.trim(),
      idNumber: record.idNumber?.trim() || '',
      fullName: record.fullName?.trim() || '',
      email: record.email?.trim() || '',
      phone: record.phone?.trim() || '',
      active: record.active || false,
      updatedAt: new Date(),
      createdAt: record.createdAt || new Date()
    };

    // Obtener datos actuales
    const currentData = await userService.getUserBankData(uid.value) || { bankData: [] };
    let updatedData: BankData[] = currentData.bankData || [];

    const index = updatedData.findIndex((b) => b.id === sanitizedRecord.id);
    
    if (index >= 0) {
      // Actualizar registro existente
      updatedData = updatedData.map((b) => 
        b.id === sanitizedRecord.id ? sanitizedRecord : b
      );
    } else {
      // Agregar nuevo registro
      updatedData = [...updatedData, sanitizedRecord];
    }

    // Verificar límite de cuentas activas
    const activeAccounts = updatedData.filter(b => b.active).length;
    if (activeAccounts > 3) {
      throw new Error('No puede tener más de 3 cuentas activas');
    }

    await userService.updateUserBankData(uid.value, { bankData: updatedData });
    bankData.value = updatedData.filter(item => item.uid === uid.value);
  };

  const fetchUserBankData = async (): Promise<BankData[]> => {
    if (!uid.value) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('El usuario no está autenticado.');
      }
      setUserAuthData({
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || '',
      });
    }

    const data = await userService.getUserBankData(uid.value);
    if (data?.bankData) {
      // Filtrar solo los registros del usuario actual
      bankData.value = data.bankData.filter(item => item.uid === uid.value);
    } else {
      bankData.value = [];
    }
    return bankData.value;
  };

  const deleteBankRecord = async (bankId: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('El usuario no está autenticado.');
    }
    const updatedData = bankData.value.filter((item) => item.id !== bankId);
    await userService.updateUserBankData(user.uid, { bankData: updatedData });
    bankData.value = updatedData;
  };

  const toggleBankActive = async (bankId: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('El usuario no está autenticado.');
    }
    const target = bankData.value.find((b) => b.id === bankId);
    if (!target) return;
    if (target.active) {
      target.active = false;
    } else {
      const activeCount = bankData.value.filter((b) => b.active).length;
      if (activeCount >= 3) {
        throw new Error('Solo se pueden tener hasta 3 cuentas activas.');
      }
      target.active = true;
    }
    await userService.updateUserBankData(user.uid, { bankData: bankData.value });
  };

  return {
    uid,
    email,
    fullName,
    bankData,
    setUserAuthData,
    setBankData,
    saveBankRecord,
    fetchUserBankData,
    deleteBankRecord,
    toggleBankActive,
  };
});
