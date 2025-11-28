import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

interface UserFormData {
  email: string;
  password: string;
  nombre: string;
  rol: "ADMIN" | "OBSTETRA";
  estado: "ACTIVO" | "INACTIVO";
  sucursal: string;
}

export const crearUsuario = functions.https.onCall(
  async (request: functions.https.CallableRequest<UserFormData>) => {
    
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Debes estar autenticado para realizar esta acción."
      );
    }

    const callerUid = request.auth.uid;
    const userDoc = await db.collection("usuarios").doc(callerUid).get();

    if (!userDoc.exists || userDoc.data()?.rol !== "ADMIN") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Solo los administradores pueden crear usuarios."
      );
    }

    const { email, password, nombre, rol, estado, sucursal } = request.data;

    try {
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: nombre,
      });

      await admin.auth().setCustomUserClaims(userRecord.uid, { rol: rol });

      await db.collection("usuarios").doc(userRecord.uid).set({
        email: email,
        nombre: nombre,
        rol: rol,
        estado: estado,
        sucursal: sucursal,
        debe_cambiar_pwd: true,
        creado_en: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        status: "success",
        message: `Usuario ${nombre} creado con éxito.`,
        uid: userRecord.uid,
      };

    } catch (error: any) {
      console.error("Error al crear usuario:", error);
      if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError("already-exists", "El correo ya está en uso.");
      }
      throw new functions.https.HttpsError("internal", error.message || "Error desconocido.");
    }
  }
);


interface UpdateUserData {
  uid: string; // ID del usuario a editar
  nombre?: string;
  password?: string; // Opcional
  rol?: "ADMIN" | "OBSTETRA";
  estado?: "ACTIVO" | "INACTIVO";
  sucursal?: string;
  dni?: string;
  colegiatura?: string;
  telefono?: string;
  jornada?: string;
}

export const actualizarUsuario = functions.https.onCall(
  async (request: functions.https.CallableRequest<UpdateUserData>) => {

    // 1. Verificación de Seguridad (Igual que arriba)
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuario no autenticado.");
    }

    const callerUid = request.auth.uid;
    const callerDoc = await db.collection("usuarios").doc(callerUid).get();

    if (!callerDoc.exists || callerDoc.data()?.rol !== "ADMIN") {
      throw new functions.https.HttpsError("permission-denied", "Solo admins pueden editar.");
    }

    // 2. Extraer datos
    const { uid, password, ...firestoreData } = request.data;

    if (!uid) {
      throw new functions.https.HttpsError("invalid-argument", "Falta el UID del usuario.");
    }

    try {
      // 3. Actualizar Password en Auth (solo si se envió y no está vacío)
      if (password && password.trim().length > 0) {
        if (password.length < 6) {
           throw new functions.https.HttpsError("invalid-argument", "La contraseña debe tener al menos 6 caracteres.");
        }
        await admin.auth().updateUser(uid, { password: password });
      }

      // 4. Actualizar Rol en Custom Claims (si cambió)
      if (firestoreData.rol) {
        await admin.auth().setCustomUserClaims(uid, { rol: firestoreData.rol });
      }

      // 5. Actualizar Documento en Firestore
      // Usamos { merge: true } implícito con .update, pero aseguramos timestamp
      await db.collection("usuarios").doc(uid).update({
        ...firestoreData,
        actualizado_en: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: "Usuario actualizado correctamente." };

    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);
      throw new functions.https.HttpsError("internal", error.message || "Error al actualizar.");
    }
  }
);