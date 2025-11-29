"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { icons } from "@/components/icons";
import { TitleShell } from "@/components/layouts/title-shell";
import { TextInput } from "@/components/text-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useTRPCClient } from "@/lib/trpc";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const trpc = useTRPCClient();

  const BackIcon = icons.arrowLeft;

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const [signalVisibility, setSignalVisibility] = useState<
    "private" | "public"
  >("private");
  const [emailVisibility, setEmailVisibility] = useState<"private" | "public">(
    "private",
  );

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<
    (() => void) | null
  >(null);

  const currentPasswordFieldId = useId();
  const newPasswordFieldId = useId();
  const confirmPasswordFieldId = useId();

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("At least one uppercase letter");
    if (!/[0-9]/.test(password)) errors.push("At least one number");
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/.test(password)) {
      errors.push("At least one special character");
    }

    return errors;
  };

  const hasUnsavedPasswordChanges = useMemo(
    () =>
      currentPassword.length > 0 ||
      newPassword.length > 0 ||
      confirmPassword.length > 0,
    [currentPassword, newPassword, confirmPassword],
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedPasswordChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    if (hasUnsavedPasswordChanges) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedPasswordChanges]);

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const errors = validatePassword(newPassword);

    if (!currentPassword) {
      setFormError("Please enter your current password. Please try again.");
      return;
    }

    if (errors.length > 0) {
      setFormError("Please meet all password requirements. Please try again.");
      return;
    }

    if (newPassword === currentPassword) {
      setFormError(
        "New password cannot be the same as your current password. Please try again.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError(
        "New password and confirmation do not match. Please try again.",
      );
      return;
    }

    try {
      setIsSubmittingPassword(true);

      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        const message = error.message ?? "Unable to change password right now.";
        setFormError(`${message} Please try again.`);
        toast.error(`${message} Please try again.`);
        return;
      }

      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFormError(null);
      setNewPasswordTouched(false);
      setConfirmTouched(false);
    } catch (error) {
      console.error(error);
      setFormError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleSignOutInternal = async () => {
    setIsSigningOut(true);
    const res = await authClient.signOut();

    if (res.error) {
      const message = res.error.message ?? "Unable to sign out right now.";
      toast.error(`${message} Please try again.`);
      setIsSigningOut(false);
      return;
    }

    router.replace("/login");
  };

  const showReqError = (condition: boolean) =>
    newPasswordTouched && !condition ? "text-error" : "text-secondary/80";

  const sameAsCurrent =
    newPasswordTouched &&
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    newPassword === currentPassword;

  const confirmMismatch =
    confirmTouched &&
    confirmPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword !== newPassword;

  const saveVisibility = async (
    nextSignal: "private" | "public",
    nextEmail: "private" | "public",
  ) => {
    try {
      setIsSavingVisibility(true);
      await trpc.user.updateUserVisibility.mutate({
        signal_visibility: nextSignal,
        email_visibility: nextEmail,
      });
      toast.success("Visibility updated.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update visibility. Please try again.");
    } finally {
      setIsSavingVisibility(false);
    }
  };

  const requestLeave = (action: () => void) => {
    if (hasUnsavedPasswordChanges) {
      setPendingLeaveAction(() => action);
      setShowLeaveConfirm(true);
      return;
    }
    action();
  };

  const handleBackClick = () => {
    requestLeave(() => router.push("/profile"));
  };

  const handleSignOutClick = () => {
    requestLeave(() => {
      void handleSignOutInternal();
    });
  };

  return (
    <TitleShell
      title={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackClick}
            aria-label="Back to profile"
            className="text-accent hover:text-accent/80 transition"
          >
            <BackIcon className="h-6 w-6" />
          </button>

          <span className="flex items-center text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            Profile settings
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-8">
        <form onSubmit={handleChangePassword} className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 py-4 px-4">
            <div className="text-base font-semibold text-secondary sm:w-48 shrink-0 pt-1">
              Change password
            </div>

            <div className="flex-1 space-y-4 max-w-xl">
              <div className="space-y-1">
                <label
                  htmlFor={currentPasswordFieldId}
                  className="text-sm font-medium text-secondary"
                >
                  Current password
                </label>
                <div className="relative">
                  <TextInput
                    id={currentPasswordFieldId}
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    className="pr-16 w-full"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-xs text-secondary/70"
                  >
                    {showCurrentPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor={newPasswordFieldId}
                  className="text-sm font-medium text-secondary"
                >
                  New password
                </label>
                <div className="relative">
                  <TextInput
                    id={newPasswordFieldId}
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={setNewPassword}
                    onBlur={() => setNewPasswordTouched(true)}
                    className="pr-16 w-full"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-xs text-secondary/70"
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {sameAsCurrent && (
                  <p className="text-xs text-error">
                    New password cannot be the same as your current password.
                  </p>
                )}

                <div className="mt-1 text-xs">
                  <p className="font-semibold text-secondary/80">
                    Password must include:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li className={showReqError(newPassword.length >= 8)}>
                      At least 8 characters
                    </li>
                    <li className={showReqError(/[A-Z]/.test(newPassword))}>
                      At least one uppercase letter
                    </li>
                    <li className={showReqError(/[0-9]/.test(newPassword))}>
                      At least one number
                    </li>
                    <li
                      className={showReqError(
                        /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/.test(
                          newPassword,
                        ),
                      )}
                    >
                      At least one special character
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor={confirmPasswordFieldId}
                  className="text-sm font-medium text-secondary"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <TextInput
                    id={confirmPasswordFieldId}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    onBlur={() => setConfirmTouched(true)}
                    className="pr-16 w-full"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-xs text-secondary/70"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {confirmMismatch && (
                  <p className="text-xs text-error">Passwords do not match.</p>
                )}
              </div>

              <div className="space-y-2 pt-2">
                {formError && <p className="text-sm text-error">{formError}</p>}

                <Button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="inline-flex items-center gap-2 px-6"
                >
                  {isSubmittingPassword && <Spinner />}
                  Save password
                </Button>
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-border flex flex-col sm:flex-row sm:items-start gap-4 py-6 px-4">
          <div className="text-base font-semibold text-secondary sm:w-48 shrink-0 pt-1">
            Visibility
          </div>
          <div className="flex-1 max-w-xl space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-secondary">Signal</p>
              <Select
                value={signalVisibility}
                onValueChange={(value) => {
                  const nextSignal = value as "private" | "public";
                  setSignalVisibility(nextSignal);
                  void saveVisibility(nextSignal, emailVisibility);
                }}
                disabled={isSavingVisibility}
              >
                <SelectTrigger
                  id="signal-visibility"
                  className="w-full sm:min-w-64"
                >
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Visible to only me</SelectItem>
                  <SelectItem value="public">Visible to anyone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-secondary">Email</p>
              <Select
                value={emailVisibility}
                onValueChange={(value) => {
                  const nextEmail = value as "private" | "public";
                  setEmailVisibility(nextEmail);
                  void saveVisibility(signalVisibility, nextEmail);
                }}
                disabled={isSavingVisibility}
              >
                <SelectTrigger
                  id="email-visibility"
                  className="w-full sm:min-w-64"
                >
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Visible to only me</SelectItem>
                  <SelectItem value="public">Visible to anyone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="border-t border-border py-6 px-4">
          <div className="flex justify-center">
            <Button
              type="button"
              variant="destructive"
              className="inline-flex items-center gap-2 px-6"
              disabled={isSigningOut}
              onClick={handleSignOutClick}
              aria-label="Log out of your account"
            >
              {isSigningOut && <Spinner />}
              Log out
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved password changes</DialogTitle>
            <DialogDescription>
              You have started updating your password but have not saved it yet.
              Are you sure you would like to leave? Your changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowLeaveConfirm(false);
                setPendingLeaveAction(null);
              }}
            >
              Keep editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const action = pendingLeaveAction;
                setShowLeaveConfirm(false);
                setPendingLeaveAction(null);
                action?.();
              }}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TitleShell>
  );
}
