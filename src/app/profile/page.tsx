'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/features/hooks';
import { rehydrateAuth } from '@/app/features/auth/slice';
import { fetchProfileThunk, saveProfileNameThunk, changePasswordThunk } from '@/app/features/auth/slice';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon, PencilSquareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { isAdmin } from '@/app/types/user';
import Button from '@/components/ui/Button'
import PageTitle from '@/components/layout/PageTitle';
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import CustomHeader from "@/components/layout/CustomHeader";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const profileStatus = useAppSelector((s) => s.auth.profileStatus);
  const profileError = useAppSelector((s) => s.auth.profileError);
  const passwordError = useAppSelector((s) => s.auth.passwordError);
  const savingProfile = useAppSelector((s) => s.auth.savingProfile);
  const [isEditing, setIsEditing] = useState(false);


  const [mounted, setMounted] = React.useState(false);
  useEffect(() => setMounted(true), []);
  const pageLoading = profileStatus === "loading" || !mounted;

  useEffect(() => {
    dispatch(rehydrateAuth());
    dispatch(fetchProfileThunk());
  }, [dispatch]);

  // 基本资料
  const [firstName, setFirstName] = useState('');
  useEffect(() => setFirstName(user?.firstName ?? ''), [user]);



  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const prevFirstName = (user?.firstName ?? '').trim();
  const [nameErr, setNameErr] = useState<string | null>(null);

  function validateFirstName(name: string) {
    const n = name.trim();
    if (n.length < 2) return 'Name must be at least 2 characters.';
    if (prevFirstName && n === prevFirstName) return 'New name must be different from current name.';
    return null;
  }


  const onSaveProfile = async () => {
    setProfileMsg(null);
    const err = validateFirstName(firstName);
    if (err) {
      setNameErr(err);
      return;
    }
    setNameErr(null);
    try {
      await dispatch(saveProfileNameThunk({ firstName })).unwrap();
      setProfileMsg('Profile updated successfully.');
      setIsEditing(false);
    } catch (e: any) {
      setProfileMsg(e?.message || 'Update failed.');
    }

  };

  // 修改密码
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdErrMsg, setPwdErrMsg] = useState<string | null>(null);

  const onChangePassword = async () => {
    setPwdMsg(null);
    setPwdErrMsg(null);
    if (newPwd !== confirmPwd) return setPwdErrMsg('New password and confirmation do not match.');
    if (newPwd.length < 6) return setPwdErrMsg('New password should be at least 6 characters.');

    try {
      await dispatch(
        changePasswordThunk({
          oldPassword: oldPwd, newPassword: newPwd
        })
      ).unwrap();
      setPwdMsg('Password changed successfully.');
      setOldPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (e: any) {
      // setPwdErrMsg(e?.message || 'Change password failed.');
    }
  };

  const isLoading = profileStatus === 'loading';

  const inputBase =
    "w-full rounded-xl bg-transparent px-3 py-2 outline-none placeholder:text-foreground/50 transition-colors";

  // 两种状态样式
  const inputReadonly =
    "border border-gray/25 border-dashed text-foreground/80 caret-transparent " +
    "focus:ring-0 cursor-default";

  const inputEditing =
    "border border-dark-green/50 bg-white/5 " +
    "focus:ring-2 focus:ring-dark-green/40 focus:border-dark-green/50";

  const inputError =
    "border border-red/50 bg-white/5 " +
    "focus:ring-2 focus:ring-dark-green/40 focus:border-dark-green/50";

  return (
    <>
      <CustomHeader
        pageTitle="My Profile"
        showLogo={true}
      />
      <PageTitle title="My Profile" showPageTitle={true} />
      <LoadingOverlay show={pageLoading} text="Loading profile…" />

      <div className="max-w-2xl mx-auto px-4 py-8 mt-1 md:mt-16">

        {/* 基本资料 */}
        <section className="bg-white/5 rounded-2xl overflow-hidden shadow-sm mb-8 border border-white/10">
          <div className='bg-page-header-bg p-6'>
            <div className="flex justify-between gap-4">
              <div className='flex  items-center gap-4'>
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-yellow/60 text-white text-2lg font-bold">
                  {user?.firstName[0]}
                </div>
                <div>
                  <div className="text-lg font-medium text-white">{user?.firstName}</div>
                  <div className="text-sm text-white">ID: {user?.id}</div>
                  <div className="text-sm text-white">{user?.email}</div>
                </div>
              </div>
              <div className='flex flex-col items-between gap-8'>

                {isAdmin(user) && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-green px-3 py-1 text-xs text-green">
                    <ShieldCheckIcon className="h-4 w-4" />
                    Admin
                  </span>
                )}

              </div>
            </div>
          </div>

          <div className="space-y-4 p-6">

            <div>
              <label htmlFor="firstName" className="block text-sm mb-1">First name</label>
              <input
                id="firstName"
                readOnly={!isEditing}
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (nameErr) setNameErr(null);
                }}
                placeholder="Your first name"
                className={`${inputBase} ${nameErr ? inputError : (isEditing ? inputEditing : inputReadonly)}`}
              />

              {/* 错误提示（只在保存失败时出现） */}
              {nameErr && <p className="mt-1 text-sm text-red-500">{nameErr}</p>}
            </div>
            <div className="mt-2 flex justify-end gap-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<PencilSquareIcon className="h-5 w-5" />}
                  onClick={() => setIsEditing(true)}
                  title="Edit profile"
                >
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    tone="brand"
                    size="md"
                    onClick={onSaveProfile}
                    loading={savingProfile}
                    loadingText="Saving..."
                    leftIcon={<CheckIcon className="h-5 w-5" />}
                    // disabled={!canSubmitProfile}
                    title="Save profile"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setFirstName(user?.firstName || '');
                      setIsEditing(false);
                      setNameErr(null);
                      setProfileMsg(null);
                    }}
                    leftIcon={<XMarkIcon className="h-5 w-5" />}
                    title="Cancel edit"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
            {profileMsg && <p className="text-sm text-green-500">{profileMsg}</p>}
            {profileError && <p className="text-sm text-red-500">{profileError}</p>}
          </div>
        </section>

        {/* 修改密码 */}
        <section className="bg-white/5 rounded-2xl p-6 shadow-sm border border-white/10">
          <h2 className="text-lg font-medium mb-4">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Current password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className={`${inputEditing} ${inputBase}`}
                  value={oldPwd}
                  onChange={(e) => {
                    setOldPwd(e.target.value)
                    if (pwdErrMsg) setPwdErrMsg(null);
                    if (profileMsg) setProfileMsg(null);
                  }}
                  onFocus={() => {
                    if (pwdErrMsg) setPwdErrMsg(null);
                    if (profileMsg) setProfileMsg(null);
                    if (isEditing) setIsEditing(false)
                  }}
                  placeholder="Current password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">New password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  className={`${inputEditing} ${inputBase}`}
                  value={newPwd}
                  onChange={(e) => {
                    setNewPwd(e.target.value)
                    if (pwdErrMsg) setPwdErrMsg(null);
                    if (profileMsg) setProfileMsg(null);
                  }}
                  onFocus={() => {
                    if (pwdErrMsg) setPwdErrMsg(null);
                    if (profileMsg) setProfileMsg(null);
                    if (isEditing) setIsEditing(false)
                  }}
                  placeholder="New password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Confirm new password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={`${inputEditing} ${inputBase}`}
                  value={confirmPwd}
                  onChange={(e) => {
                    setConfirmPwd(e.target.value)
                    if (pwdErrMsg) setPwdErrMsg(null);
                    if (profileMsg) setProfileMsg(null);
                  }}

                  onFocus={() => {
                    if (pwdErrMsg) setPwdErrMsg(null);
                    if (profileMsg) setProfileMsg(null);
                    if (isEditing) setIsEditing(false)
                  }}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                onClick={onChangePassword}
                disabled={isLoading}
                className="inline-flex items-center rounded-xl bg-emerald-600 text-white px-4 py-2 disabled:opacity-50"
              >
                {isLoading ? 'Updating…' : 'Update password'}
              </button>
            </div>

            {pwdMsg && <p className="text-sm text-green-500">{pwdMsg}</p>}
            {pwdErrMsg && <p className="text-sm text-red-500">{pwdErrMsg}</p>}
            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
          </div>
        </section>
      </div>
    </>
  );
}
