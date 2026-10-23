/** Retry the whole unit of work; never retry a synchronization in an old transaction snapshot. */
export async function retryTaskCenterTransaction<T>(
  work: () => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await work();
    } catch (error) {
      const seen = new Set<unknown>();
      let current: unknown = error,
        retryable = false;
      while (current && typeof current === 'object' && !seen.has(current)) {
        seen.add(current);
        const code: unknown = Reflect.get(current, 'code');
        if (
          ['CONFLICT', '40P01', '40001', 'ER_LOCK_DEADLOCK'].includes(
            String(code),
          )
        )
          retryable = true;
        current =
          Reflect.get(current, 'cause') ??
          Reflect.get(current, 'originalError');
      }
      if (!retryable || attempt >= 3) throw error;
    }
  }
}
