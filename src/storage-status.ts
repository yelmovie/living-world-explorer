/** Storage problems must remain visible, including memory-only fallback. */
export function needsStorageWarning(message:string){return /^(임시 저장|다른 창|저장 원본|저장 실패|사진이 빠져)/.test(message);}
