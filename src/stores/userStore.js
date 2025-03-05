import { defineStore } from 'pinia';
import { ref } from 'vue';
import userService from '../services/userService';
import { auth } from '../firebase/config';

export const useUserStore = defineStore('user', () => {
  // Datos básicos de autenticación
  const uid = ref('');
  const email = ref('');
  const fullName = ref('');

  // Datos bancarios del usuario (inicialmente un arreglo vacío)
  const bankData = ref([]);

  /**
   * Establece los datos de autenticación del usuario.
   */
  const setUserAuthData = (user) => {
    uid.value = user.uid;
    email.value = user.email;
    fullName.value = user.displayName || '';
  };

  /**
   * Actualiza el arreglo de datos bancarios en el store.
   */
  const setBankData = (data) => {
    bankData.value = data;
  };

  /**
   * Actualiza o registra los datos bancarios del usuario en Firestore.
   */
  const updateBankData = async (data) => {
    if (!uid.value) {
      throw new Error('El usuario no está autenticado.');
    }
    fullName.value = data.fullName;
    const dataToSave = {
      uid: uid.value,
      email: email.value,
      fullName: fullName.value,
      num_cuenta: data.numCuenta,
      num_documento: data.numDocumento,
      num_telefono: data.numTelefono,
    };
    await userService.updateUserBankData(uid.value, dataToSave);
  };

  /**
   * Recupera los datos bancarios del usuario desde Firestore.
   * Se filtra para devolver solo aquellos registros cuyo uid coincida con el usuario autenticado.
   */
  const fetchUserBankData = async () => {
    if (!uid.value) {
      throw new Error('El usuario no está autenticado.');
    }
    const data = await userService.getUserBankData(uid.value);
    if (data) {
      fullName.value = data.fullName;
      bankData.value = data.bankData
        ? data.bankData.filter((item) => item.uid === uid.value)
        : [];
    } else {
      bankData.value = [];
    }
    return bankData.value;
  };

  /**
   * Elimina un registro bancario y actualiza Firestore.
   */
  const deleteBankRecord = async (bankId) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('El usuario no está autenticado.');
    }
    bankData.value = bankData.value.filter((item) => item.id !== bankId);
    await userService.updateUserBankData(user.uid, { bankData: bankData.value });
  };

  /**
   * Cambia el estado de activación de una cuenta bancaria.
   * Se permite tener hasta 3 cuentas activas; si ya hay 3 activas, se lanza un error.
   */
  const toggleBankActive = async (bankId) => {
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
    updateBankData,
    fetchUserBankData,
    deleteBankRecord,
    toggleBankActive,
  };
});
