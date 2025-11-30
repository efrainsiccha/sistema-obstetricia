import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// --- 1. CREAR USUARIO ---

// Actualizamos la interfaz para incluir TODOS los campos
interface UserFormData {
  email: string;
  password: string;
  nombre: string;
  rol: "ADMIN" | "OBSTETRA";
  estado: "ACTIVO" | "INACTIVO";
  sucursal: string;
  // CAMPOS NUEVOS AGREGADOS:
  dni?: string;
  colegiatura?: string;
  telefono?: string;
  jornada?: string;
}

export const crearUsuario = functions.https.onCall(
  async (request: functions.https.CallableRequest<UserFormData>) => {
    
    // Verificación de Autenticación
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Debes estar autenticado para realizar esta acción."
      );
    }

    // Verificación de Rol ADMIN
    const callerUid = request.auth.uid;
    const userDoc = await db.collection("usuarios").doc(callerUid).get();

    if (!userDoc.exists || userDoc.data()?.rol !== "ADMIN") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Solo los administradores pueden crear usuarios."
      );
    }

    // EXTRAEMOS TODOS LOS DATOS (Incluyendo los nuevos)
    const { 
      email, 
      password, 
      nombre, 
      rol, 
      estado, 
      sucursal,
      dni,          // <--- Nuevo
      colegiatura,  // <--- Nuevo
      telefono,     // <--- Nuevo
      jornada       // <--- Nuevo
    } = request.data;

    try {
      // A. Crear en Auth
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: nombre,
      });

      // B. Asignar Claims
      await admin.auth().setCustomUserClaims(userRecord.uid, { rol: rol });

      // C. Crear en Firestore (GUARDAMOS TODO)
      await db.collection("usuarios").doc(userRecord.uid).set({
        email: email,
        nombre: nombre,
        rol: rol,
        estado: estado,
        sucursal: sucursal,
        // Guardamos los campos opcionales (o string vacío si no vienen)
        dni: dni || "", 
        colegiatura: colegiatura || "",
        telefono: telefono || "",
        jornada: jornada || "",
        
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

// --- 2. ACTUALIZAR USUARIO ---

interface UpdateUserData {
  uid: string;
  nombre?: string;
  password?: string;
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

    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuario no autenticado.");
    }

    const callerUid = request.auth.uid;
    const callerDoc = await db.collection("usuarios").doc(callerUid).get();

    if (!callerDoc.exists || callerDoc.data()?.rol !== "ADMIN") {
      throw new functions.https.HttpsError("permission-denied", "Solo admins pueden editar.");
    }

    const { uid, password, ...firestoreData } = request.data;

    if (!uid) {
      throw new functions.https.HttpsError("invalid-argument", "Falta el UID del usuario.");
    }

    try {
      // 3. Actualizar Password en Auth (solo si se envió)
      if (password && password.trim().length > 0) {
        if (password.length < 6) {
           throw new functions.https.HttpsError("invalid-argument", "La contraseña debe tener al menos 6 caracteres.");
        }
        await admin.auth().updateUser(uid, { password: password });
      }

      // 4. Actualizar Rol en Custom Claims
      if (firestoreData.rol) {
        await admin.auth().setCustomUserClaims(uid, { rol: firestoreData.rol });
      }

      // 5. Actualizar Documento en Firestore
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