"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { changePasswordThunk, logoutThunk } from "@/app/features/auth/slice";
import PageTitle from "@/components/layout/PageTitle";
import CustomHeader from "@/components/layout/CustomHeader";
import Button from "@/components/ui/Button";

const MIN_PASSWORD = 6;

/** 必须先改密码（管理员重置过密码）。也可以从这里登出 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forced = !!user?.must_change_password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < MIN_PASSWORD) return setError(`New password must be at least ${MIN_PASSWORD} characters.`);
    if (newPassword !== confirm) return setError("The new passwords don't match.");
    setSaving(true);
    try {
      await dispatch(changePasswordThunk({ oldPassword, newPassword })).unwrap();
      router.replace("/");
    } catch (err: any) {
      setError(typeof err === "string" ? err : err?.message || "Change password failed");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await dispatch(logoutThunk());
    router.replace("/auth");
  };

  const input = "w-full rounded-sm border border-border bg-white p-2 text-[16px]";

  return (
    <>
      <CustomHeader pageTitle="Change password" showLogo={true} />
      <PageTitle title="Change password" showPageTitle />
      <div className="mx-auto w-full max-w-md p-4 min-h-screen mt-0 md:mt-16">
        {forced && (
          <p className="mb-4 rounded-sm border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="note">
            Your password was reset by an admin. Please choose a new password to continue.
          </p>
        )}
        <form onSubmit={submit} className="space-y-3 rounded-md border border-border bg-white p-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-dark-gray">{forced ? "Initial password" : "Current password"}</span>
            <input type="password" autoComplete="current-password" className={input} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-dark-gray">New password</span>
            <input type="password" autoComplete="new-password" className={input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-dark-gray">Confirm new password</span>
            <input type="password" autoComplete="new-password" className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </label>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button type="button" className="text-sm text-dark-gray underline underline-offset-2 hover:text-dark-green" onClick={logout}>
              Log out
            </button>
            <Button type="submit" variant="primary" loading={saving} loadingText="Saving…">
              Change password
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
