/**
 * Utility to enforce a strict timeout on async operations.
 * Defaults to 30,000 ms (30 seconds).
 */
export class TimeoutError extends Error {
  constructor(message: string = "Permintaan melebihi batas waktu 30 detik.") {
    super(message);
    this.name = "TimeoutError";
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 30000,
  errorMessage: string = "Permintaan melebihi batas waktu 30 detik."
): Promise<T> {
  let timer: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new TimeoutError(errorMessage));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}
