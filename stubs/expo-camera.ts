/**
 * F-Droid stub for expo-camera.
 *
 * Replaces expo-camera at Metro bundle time for F-Droid builds.
 * expo-camera pulls in Google MLKit/GMS barcode scanning which is not
 * permitted in F-Droid APKs.
 */

export const CameraView = null;
export const useCameraPermissions = () => [null, () => Promise.resolve(null)];
