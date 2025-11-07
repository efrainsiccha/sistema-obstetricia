import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// 1. Definimos el "shape" (tipo) de los datos que esperamos del frontend
interface UserFormData {
  email: string;
  password: string;
  nombre: string;
  rol: "ADMIN" | "OBSTETRA";
  estado: "ACTIVO" | "INACTIVO";
  sucursal: string;
}

// 2. Definimos nuestra función "crearUsuario"
export const crearUsuario = functions.https.onCall(
  async (request: functions.https.CallableRequest<UserFormData>) => {
    
    // 3. VERIFICACIÓN DE SEGURIDAD
    // Corregido: Usamos 'request.auth' en lugar de 'context.auth'
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Debes estar autenticado para realizar esta acción."
      );
    }

    // Corregido: Usamos 'request.auth.uid'
    const callerUid = request.auth.uid;
    const userDoc = await db.collection("usuarios").doc(callerUid).get();

    if (!userDoc.exists || userDoc.data()?.rol !== "ADMIN") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Solo los administradores pueden crear usuarios."
      );
    }
    // 5. Datos que recibimos
    // Corregido: Usamos 'request.data' en lugar de solo 'data'
    const { email, password, nombre, rol, estado, sucursal } = request.data;

    try {
      // 6. PASO A: Creamos el usuario en Authentication
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: nombre,
      });

      // 7. PASO B: Asignamos el ROL
      await admin.auth().setCustomUserClaims(userRecord.uid, { rol: rol });

      // 8. PASO C: Creamos el documento en Firestore
      await db.collection("usuarios").doc(userRecord.uid).set({
        email: email,
        nombre: nombre,
        rol: rol,
        estado: estado,
        sucursal: sucursal,
        debe_cambiar_pwd: true,
        creado_en: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 9. Éxito
      return {
        status: "success",
        message: `Usuario ${nombre} creado con éxito.`,
        uid: userRecord.uid,
      };

    } catch (error: any) {
      // 10. Manejo de errores
      console.error("Error al crear usuario:", error);
      
      if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError(
          "already-exists",
          "El correo electrónico ya está en uso por otro usuario."
        );
      }
      
      throw new functions.https.HttpsError(
        "internal",
        error.message || "Ocurrió un error desconocido."
      );
    }
  }
);