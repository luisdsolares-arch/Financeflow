import { Capacitor } from "@capacitor/core";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";

const BIOMETRIC_ENABLED_KEY = "financeflow.biometric.enabled";
const BIOMETRIC_CREDENTIAL_ID_KEY = "financeflow.biometric.credentialId";
const BIOMETRIC_EMAIL_KEY = "financeflow.biometric.email";
const BIOMETRIC_TOKEN_KEY = "financeflow.biometric.token";
const BIOMETRIC_NATIVE_KEY = "financeflow.biometric.native";

const isNativePlatform = () => {
  const platform = Capacitor.getPlatform();
  return platform === "android" || platform === "ios";
};

const toBase64Url = (bytes) => {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (value) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const randomChallenge = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
};

export const isBiometricSupported = () => {
  if (isNativePlatform()) {
    return true;
  }
  return Boolean(window.PublicKeyCredential) && window.isSecureContext;
};

export const getBiometricAvailability = async () => {
  if (isNativePlatform()) {
    try {
      const info = await BiometricAuth.checkBiometry();
      return {
        supported: Boolean(info.isAvailable || info.deviceIsSecure),
        reason: info.reason || "",
      };
    } catch {
      return {
        supported: false,
        reason: "La biometría nativa no está disponible en este dispositivo.",
      };
    }
  }

  const supported = Boolean(window.PublicKeyCredential) && window.isSecureContext;
  return {
    supported,
    reason: supported ? "" : "El navegador no permite biometría WebAuthn en este contexto.",
  };
};

export const isBiometricEnabled = () => {
  return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === "true";
};

export const saveBiometricSessionToken = (token) => {
  if (!token || !isBiometricEnabled()) {
    return;
  }
  localStorage.setItem(BIOMETRIC_TOKEN_KEY, token);
};

export const getBiometricSessionToken = () => localStorage.getItem(BIOMETRIC_TOKEN_KEY);

export const clearBiometricConfig = () => {
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  localStorage.removeItem(BIOMETRIC_CREDENTIAL_ID_KEY);
  localStorage.removeItem(BIOMETRIC_EMAIL_KEY);
  localStorage.removeItem(BIOMETRIC_TOKEN_KEY);
  localStorage.removeItem(BIOMETRIC_NATIVE_KEY);
};

export const enableBiometricLogin = async (email) => {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Debes definir un correo antes de activar biometría.");
  }

  const availability = await getBiometricAvailability();
  if (!availability.supported) {
    throw new Error(availability.reason || "Este dispositivo no soporta biometría.");
  }

  if (isNativePlatform()) {
    // On native platforms we trust the OS prompt and keep a simple local flag.
    await BiometricAuth.authenticate({
      reason: "Activa biometría para ingresar a FinanceFlow",
      androidTitle: "Activar biometría",
      androidSubtitle: "Confirma tu identidad",
      allowDeviceCredential: true,
      androidConfirmationRequired: false,
    });

    localStorage.setItem(BIOMETRIC_EMAIL_KEY, normalizedEmail);
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
    localStorage.setItem(BIOMETRIC_NATIVE_KEY, "true");
    return;
  }

  const userBytes = new TextEncoder().encode(normalizedEmail.slice(0, 64));
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge(),
      rp: {
        name: "FinanceFlow",
        id: window.location.hostname,
      },
      user: {
        id: userBytes,
        name: normalizedEmail,
        displayName: normalizedEmail,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      timeout: 60000,
      attestation: "none",
      authenticatorSelection: {
        userVerification: "required",
        residentKey: "preferred",
      },
    },
  });

  if (!credential?.rawId) {
    throw new Error("No se pudo registrar biometría en este dispositivo.");
  }

  const credentialId = toBase64Url(new Uint8Array(credential.rawId));
  localStorage.setItem(BIOMETRIC_CREDENTIAL_ID_KEY, credentialId);
  localStorage.setItem(BIOMETRIC_EMAIL_KEY, normalizedEmail);
  localStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
  localStorage.setItem(BIOMETRIC_NATIVE_KEY, "false");
};

export const authenticateWithBiometric = async () => {
  const availability = await getBiometricAvailability();
  if (!availability.supported) {
    throw new Error(availability.reason || "Este dispositivo no soporta biometría.");
  }

  if (isNativePlatform()) {
    if (!isBiometricEnabled()) {
      throw new Error("La biometría no está configurada en este dispositivo.");
    }

    await BiometricAuth.authenticate({
      reason: "Confirma tu identidad para continuar",
      androidTitle: "Ingreso biométrico",
      androidSubtitle: "Accede a tu cuenta",
      allowDeviceCredential: true,
      androidConfirmationRequired: false,
    });
    return true;
  }

  const credentialId = localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY);
  if (!credentialId || !isBiometricEnabled()) {
    throw new Error("La biometría no está configurada en este dispositivo.");
  }

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge(),
      allowCredentials: [
        {
          id: fromBase64Url(credentialId),
          type: "public-key",
        },
      ],
      userVerification: "required",
      timeout: 60000,
    },
  });

  if (!assertion) {
    throw new Error("No se pudo validar tu identidad biométrica.");
  }

  return true;
};
