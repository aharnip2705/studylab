"use client";

import { SWRConfig } from "swr";

const swrConfig = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
  errorRetryCount: 2,
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
