"use client";

import { FirebaseError } from "firebase/app";
import { inMemoryPersistence, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { firebaseAuth } from "../firebase-client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await setPersistence(firebaseAuth, inMemoryPersistence);
      const credential = await signInWithEmailAndPassword(firebaseAuth, String(form.get("email") ?? "").trim(), String(form.get("password") ?? ""));
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: await credential.user.getIdToken() }),
      });
      await signOut(firebaseAuth);
      if (!response.ok) throw new Error("SESSION");
      router.replace("/");
      router.refresh();
    } catch (cause) {
      const blocked = cause instanceof FirebaseError && cause.code === "auth/too-many-requests";
      setError(blocked ? "Demasiados intentos. Espera unos minutos antes de volver a intentar." : "El correo o la contraseña no son correctos.");
      setPending(false);
    }
  }

  return <form className="mt-8 space-y-5" onSubmit={submit}>
    <label className="block text-sm font-semibold text-slate-700" htmlFor="email">Correo electrónico<input autoComplete="email" autoFocus className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" id="email" name="email" required type="email" /></label>
    <label className="block text-sm font-semibold text-slate-700" htmlFor="password">Contraseña<input autoComplete="current-password" className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" id="password" name="password" required type="password" /></label>
    {error ? <p aria-live="polite" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    <button className="w-full rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">{pending ? "Ingresando…" : "Ingresar"}</button>
  </form>;
}
