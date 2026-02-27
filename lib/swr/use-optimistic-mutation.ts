"use client";

import { useCallback } from "react";
import { KeyedMutator } from "swr";

type MutateFn = KeyedMutator<unknown>;

/**
 * Optimistic mutation helper: önce cache'i güncelle, sonra mutation çalıştır.
 * Hata olursa önceki veriyi geri yükle.
 */
export function useOptimisticUpdate<T>(
  mutate: MutateFn,
  optimisticData: T
) {
  return useCallback(
    async (
      mutationFn: () => Promise<{ error?: string }>,
      onSuccess?: () => void
    ) => {
      const previousData = await mutate(optimisticData, false);
      const result = await mutationFn();
      if (result.error) {
        await mutate(previousData, false);
        throw new Error(result.error);
      }
      await mutate();
      onSuccess?.();
    },
    [mutate, optimisticData]
  );
}
