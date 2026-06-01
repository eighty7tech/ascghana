"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Switch } from "@/components/ui";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";

interface AdminUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: "superadmin" | "admin" | "moderator";
  isActive: boolean;
  createdAt?: string;
  lastLogin?: string;
}

interface FormState {
  id?: string;
  username: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "superadmin" | "admin" | "moderator";
  isActive: boolean;
}

export default function AdminUsersSettingsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordUser, setPasswordUser] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormState>({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Load admin users
  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings/admin-users");
      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins || []);
      } else {
        toast.error(data.error || "Failed to load admin users");
      }
    } catch (error) {
      toast.error("Error loading admin users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!isEditing && !formData.password) {
      newErrors.password = "Password is required";
    }
    if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const payload: any = {
        username: formData.username,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
      };

      if (formData.password) payload.password = formData.password;

      const method = isEditing ? "PUT" : "POST";
      const url = isEditing 
        ? `/api/admin/settings/admin-users?id=${formData.id}` 
        : `/api/admin/settings/admin-users`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEditing ? "Admin updated successfully" : "Admin created successfully");
        setShowForm(false);
        setIsEditing(false);
        resetForm();
        loadAdmins();
      } else {
        toast.error(data.error || "Failed to save admin");
      }
    } catch (error) {
      toast.error("Error saving admin user");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (admin: AdminUser) => {
    setFormData({
      id: admin.id,
      username: admin.username,
      name: admin.name,
      email: admin.email || "",
      password: "",
      confirmPassword: "",
      role: admin.role,
      isActive: admin.isActive,
    });
    setIsEditing(true);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admin user?")) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/settings/admin-users?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Admin deleted successfully");
        loadAdmins();
      } else {
        toast.error(data.error || "Failed to delete admin");
      }
    } catch (error) {
      toast.error("Error deleting admin");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (userId: string) => {
    if (!currentPassword.trim()) {
      toast.error("Please enter a password");
      return;
    }
    if (currentPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/settings/admin-users/password?id=${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: currentPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setPasswordUser(null);
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("Error changing password");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "admin",
      isActive: true,
    });
    setErrors({});
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEditing(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="text-center text-white">Loading admin users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-8">
      <PageHeader title="Admin Users" subtitle="Manage admin accounts and permissions" />

      <div className="max-w-6xl mx-auto mt-8">
        {/* Add New Admin Button */}
        {!showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <Button
              onClick={() => {
                setShowForm(true);
                setIsEditing(false);
                resetForm();
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              <i className="fas fa-plus mr-2"></i>
              Add New Admin
            </Button>
          </motion.div>
        )}

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border border-amber-500/20 bg-slate-800/50">
              <CardHeader>
                <CardTitle>
                  {isEditing ? "Edit Admin User" : "Create New Admin"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormGroup label="Username">
                      <Input
                        type="text"
                        placeholder="e.g., admin"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        disabled={isEditing}
                        className={errors.username ? "border-red-500" : ""}
                      />
                      {errors.username && (
                        <p className="text-red-400 text-sm mt-1">{errors.username}</p>
                      )}
                    </FormGroup>

                    <FormGroup label="Full Name">
                      <Input
                        type="text"
                        placeholder="e.g., John Doe"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && (
                        <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                      )}
                    </FormGroup>

                    <FormGroup label="Email">
                      <Input
                        type="email"
                        placeholder="admin@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                      )}
                    </FormGroup>

                    <FormGroup label="Role">
                      <select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            role: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                      >
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                        <option value="moderator">Moderator</option>
                      </select>
                    </FormGroup>

                    {!isEditing && (
                      <>
                        <FormGroup label="Password">
                          <Input
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({ ...formData, password: e.target.value })
                            }
                            className={errors.password ? "border-red-500" : ""}
                          />
                          {errors.password && (
                            <p className="text-red-400 text-sm mt-1">
                              {errors.password}
                            </p>
                          )}
                        </FormGroup>

                        <FormGroup label="Confirm Password">
                          <Input
                            type="password"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className={
                              errors.confirmPassword ? "border-red-500" : ""
                            }
                          />
                          {errors.confirmPassword && (
                            <p className="text-red-400 text-sm mt-1">
                              {errors.confirmPassword}
                            </p>
                          )}
                        </FormGroup>
                      </>
                    )}
                  </div>

                  <FormGroup label="Active">
                    <Switch
                      checked={formData.isActive}
                      onChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                    />
                    <p className="text-sm text-gray-400 mt-2">
                      {formData.isActive
                        ? "Admin can log in"
                        : "Admin account is disabled"}
                    </p>
                  </FormGroup>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 flex-1"
                    >
                      {saving ? "Saving..." : "Save Admin"}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCancel}
                      className="bg-slate-700 hover:bg-slate-600 flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Admin Users List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border border-amber-500/20">
            <CardHeader>
              <CardTitle>
                Admin Users ({admins.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {admins.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No admin users found. Create one to get started.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 font-semibold">Username</th>
                        <th className="text-left py-3 px-4 font-semibold">Name</th>
                        <th className="text-left py-3 px-4 font-semibold">Role</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 font-semibold">Last Login</th>
                        <th className="text-right py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr
                          key={admin.id}
                          className="border-b border-slate-700/50 hover:bg-slate-700/20 transition"
                        >
                          <td className="py-3 px-4 font-mono">{admin.username}</td>
                          <td className="py-3 px-4">{admin.name}</td>
                          <td className="py-3 px-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300">
                              {admin.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {admin.isActive ? (
                              <span className="text-green-400 flex items-center">
                                <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                Active
                              </span>
                            ) : (
                              <span className="text-gray-400 flex items-center">
                                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {admin.lastLogin
                              ? new Date(admin.lastLogin).toLocaleDateString()
                              : "Never"}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => setPasswordUser(admin.id)}
                              className="text-blue-400 hover:text-blue-300 text-xs"
                              title="Change Password"
                            >
                              <i className="fas fa-key"></i>
                            </button>
                            <button
                              onClick={() => handleEdit(admin)}
                              className="text-amber-400 hover:text-amber-300 text-xs"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(admin.id)}
                              className="text-red-400 hover:text-red-300 text-xs"
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Change Password Modal */}
        {passwordUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setPasswordUser(null)}
          >
            <Card
              className="border border-amber-500/20 bg-slate-800 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <FormGroup label="New Password">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Minimum 8 characters
                  </p>
                </FormGroup>
                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={() => handleChangePassword(passwordUser)}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={() => {
                      setPasswordUser(null);
                      setCurrentPassword("");
                    }}
                    className="bg-slate-700 hover:bg-slate-600 flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
