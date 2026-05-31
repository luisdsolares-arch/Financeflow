const BIOMETRIC_ENABLED_KEY = "financeflow.biometric.enabled";
const BIOMETRIC_CREDENTIAL_ID_KEY = "financeflow.biometric.credentialId";
const BIOMETRIC_EMAIL_KEY = "financeflow.biometric.email";
const BIOMETRIC_TOKEN_KEY = "financeflow.biometric.token";

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
  return Boolean(window.PublicKeyCredential) && window.isSecureContext;
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
};

export const enableBiometricLogin = async (email) => {
  if (!isBiometricSupported()) {
    throw new Error("Este dispositivo no soporta biometría web.");
  }

  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Debes definir un correo antes de activar biometría.");
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
};

export const authenticateWithBiometric = async () => {
  if (!isBiometricSupported()) {
    throw new Error("Este dispositivo no soporta biometría web.");
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
