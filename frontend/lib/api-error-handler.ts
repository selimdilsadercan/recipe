/**
 * API Error Handler
 * Encore API hatalarını işlemek için utility fonksiyonlar
 */

import { APIError, ErrCode, isAPIError } from "./client";

/**
 * Hata mesajı oluşturur (kullanıcıya gösterilecek)
 */
export function getErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    // Encore API Error
    switch (error.code) {
      case ErrCode.Unauthenticated:
        return "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.";
      case ErrCode.PermissionDenied:
        return "Bu işlem için yetkiniz yok.";
      case ErrCode.NotFound:
        return "Aradığınız kaynak bulunamadı.";
      case ErrCode.InvalidArgument:
        return "Geçersiz istek. Lütfen bilgilerinizi kontrol edin.";
      case ErrCode.AlreadyExists:
        return "Bu kayıt zaten mevcut.";
      case ErrCode.ResourceExhausted:
        return "Çok fazla istek gönderildi. Lütfen biraz bekleyin.";
      case ErrCode.Unavailable:
        return "Servis şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.";
      default:
        return error.message || "Beklenmeyen bir hata oluştu.";
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "Beklenmeyen bir hata oluştu.";
}

/**
 * Authentication hatası mı kontrol eder
 */
export function isUnauthenticatedError(error: unknown): boolean {
  if (isAPIError(error)) {
    return error.code === ErrCode.Unauthenticated;
  }
  return false;
}

/**
 * Not found hatası mı kontrol eder
 */
export function isNotFoundError(error: unknown): boolean {
  if (isAPIError(error)) {
    return error.code === ErrCode.NotFound;
  }
  return false;
}

/**
 * Permission denied hatası mı kontrol eder
 */
export function isPermissionDeniedError(error: unknown): boolean {
  if (isAPIError(error)) {
    return error.code === ErrCode.PermissionDenied;
  }
  return false;
}

/**
 * Validation hatası mı kontrol eder
 */
export function isValidationError(error: unknown): boolean {
  if (isAPIError(error)) {
    return error.code === ErrCode.InvalidArgument;
  }
  return false;
}

// Re-export useful types
export { APIError, ErrCode, isAPIError };
