import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import { formatDate } from "../../utils/formatters";
import {
  PageShell,
  PrimaryButton,
  SectionCard,
} from "../../components/common/ui";

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const [profileForm, setProfileForm] = useState({
    username: "",
    email: "",
    profileImage: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setProfileForm({
      username: user?.username || "",
      email: user?.email || "",
      profileImage: user?.profileImage || "",
    });
  }, [user]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    try {
      setSavingProfile(true);
      const response = await authService.updateProfile(profileForm);
      updateUser(response.data);
      toast.success(response.message || "Profile updated");
    } catch (requestError) {
      toast.error(requestError.error || requestError.message || "Could not update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    try {
      setSavingPassword(true);
      const response = await authService.changePassword(passwordForm);
      toast.success(response.message || "Password changed");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (requestError) {
      toast.error(requestError.error || requestError.message || "Could not change password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <PageShell
      title="Profile"
      description="Manage your account details and security settings."
    >
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <SectionCard title="Account overview" description="Current session and profile metadata.">
          <div className="rounded-4xl bg-[linear-gradient(180deg,#0f172a_0%,#1e293b_100%)] p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-300">Account</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">{user?.username}</h2>
            <p className="mt-2 break-all text-sm text-slate-300">{user?.email}</p>
            <p className="mt-6 text-sm text-slate-300">
              Member since {formatDate(user?.createdAt, { withTime: true })}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            Sign out of this session
          </button>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Edit profile" description="Update your username, email, or avatar URL.">
            <form onSubmit={handleProfileSubmit} className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Username</span>
                <input
                  value={profileForm.username}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, username: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  required
                />
              </label>

              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Profile image URL</span>
                <input
                  value={profileForm.profileImage}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, profileImage: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  placeholder="https://example.com/avatar.jpg"
                />
              </label>

              <div className="md:col-span-2">
                <PrimaryButton type="submit" disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save profile changes"}
                </PrimaryButton>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Change password" description="Use your current password to set a new one.">
            <form onSubmit={handlePasswordSubmit} className="grid gap-4 md:grid-cols-2">
              {[
                ["currentPassword", "Current password"],
                ["newPassword", "New password"],
                ["confirmPassword", "Confirm new password"],
              ].map(([name, label]) => (
                <label key={name} className={`block space-y-2 ${name === "confirmPassword" ? "md:col-span-2" : ""}`}>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <input
                    type="password"
                    value={passwordForm[name]}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, [name]: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    required
                  />
                </label>
              ))}

              <div className="md:col-span-2">
                <PrimaryButton type="submit" disabled={savingPassword}>
                  {savingPassword ? "Updating..." : "Update password"}
                </PrimaryButton>
              </div>
            </form>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
};

export default ProfilePage;