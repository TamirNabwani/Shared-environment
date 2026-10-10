import { useEffect, useState } from 'react';

type Listener = (msg: string) => void;
const listeners = new Set<Listener>();

export function toast(msg: string) {
  listeners.forEach((l) => l(msg));
}

export function Toaster() {
  const [msgs, setMsgs] = useState<{ id: number; msg: string }[]>([]);
  useEffect(() => {
    const l: Listener = (msg) => {
      const id = Date.now() + Math.random();
      setMsgs((m) => [...m, { id, msg }]);
      setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== id)), 4000);
    };
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      {msgs.map((m) => (
        <div key={m.id} className="rounded-lg bg-[var(--surface-2)] px-4 py-2 text-sm shadow-lg ring-1 ring-[#3a3936]">
          {m.msg}
        </div>
      ))}
    </div>
  );
}
