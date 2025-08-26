"use client";

import { useCallback, useState } from "react";

export function useConfirm<T = void>(defaultMessage = "Are you sure?") {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<T | null>(null);
  const [message, setMessage] = useState(defaultMessage);

  const ask = useCallback((t?: T, m?: string) => {
    setTarget((t as T) ?? null);
    if (m) setMessage(m);
    setOpen(true);
  }, []);

  const cancel = useCallback(() => {
    setOpen(false);
    setTarget(null);
  }, []);

  const confirm = useCallback(
    (handler: (t: T | null) => void | Promise<void>) => {
      return async () => {
        await handler(target);
        setOpen(false);
        setTarget(null);
      };
    },
    [target]
  );



  return { open, message, target, ask, cancel, confirm, setMessage };
}
