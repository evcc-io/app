import * as SecureStore from "expo-secure-store";

export async function storeCert(key: string, p12Base64: string, password: string) {
  await SecureStore.setItemAsync(key, p12Base64);
  await SecureStore.setItemAsync(`${key}_pass`, password);
}

export async function loadCert(key: string): Promise<{ p12Base64: string; password: string } | null> {
  const p12Base64 = await SecureStore.getItemAsync(key);
  const password = await SecureStore.getItemAsync(`${key}_pass`);
  
  if (p12Base64 && password !== null) {
    return { p12Base64, password };
  }
  return null;
}

export async function deleteCert(key: string) {
  await SecureStore.deleteItemAsync(key);
  await SecureStore.deleteItemAsync(`${key}_pass`);
}
