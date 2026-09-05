"use client";

import { useState } from "react";
import {
  useSettingsStore,
  saveFile,
  openFileOrFiles,
  writeFileOverwolf,
  Profile,
} from "@repo/lib";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { toast } from "sonner";
import { Trash2, Copy, Download, Upload, Edit, UserPlus } from "lucide-react";
import { useT } from "../(providers)";

export function ProfileManager({ activeApp }: { activeApp: string }) {
  const t = useT();
  const settingsStore = useSettingsStore();
  const [newProfileName, setNewProfileName] = useState("");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingProfileName, setEditingProfileName] = useState("");
  const [duplicateProfileId, setDuplicateProfileId] = useState<string | null>(
    null,
  );
  const [duplicateProfileName, setDuplicateProfileName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  const currentProfile = settingsStore.profiles.find(
    (p) => p.id === settingsStore.currentProfileId,
  );

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) {
      toast.error(
        t("profiles.nameEmpty", { fallback: "Profile name cannot be empty" }),
      );
      return;
    }
    if (settingsStore.profiles.some((p) => p.name === newProfileName.trim())) {
      toast.error(
        t("profiles.nameExists", {
          fallback: "A profile with this name already exists",
        }),
      );
      return;
    }
    settingsStore.createProfile(newProfileName.trim());
    setNewProfileName("");
    setCreateDialogOpen(false);
    toast.success(
      t("profiles.created", {
        fallback: 'Profile "{{name}}" created',
        vars: { name: newProfileName },
      }),
    );
  };

  const handleRenameProfile = () => {
    if (!editingProfileName.trim()) {
      toast.error(
        t("profiles.nameEmpty", { fallback: "Profile name cannot be empty" }),
      );
      return;
    }
    if (
      settingsStore.profiles.some(
        (p) =>
          p.name === editingProfileName.trim() && p.id !== editingProfileId,
      )
    ) {
      toast.error(
        t("profiles.nameExists", {
          fallback: "A profile with this name already exists",
        }),
      );
      return;
    }
    if (editingProfileId) {
      settingsStore.renameProfile(editingProfileId, editingProfileName.trim());
      setEditingProfileId(null);
      setEditingProfileName("");
      setRenameDialogOpen(false);
      toast.success(t("profiles.renamed", { fallback: "Profile renamed" }));
    }
  };

  const handleSwitchProfile = (profileId: string) => {
    if (profileId === settingsStore.currentProfileId) return;
    const profile = settingsStore.profiles.find((p) => p.id === profileId);
    if (profile) {
      settingsStore.switchProfile(profileId);
      toast.success(
        t("profiles.switched", {
          fallback: 'Switched to profile "{{name}}"',
          vars: { name: profile.name },
        }),
      );
    }
  };

  const handleDeleteProfile = (profileId: string, profileName: string) => {
    if (settingsStore.profiles.length <= 1) {
      toast.error(
        t("profiles.cannotDeleteLast", {
          fallback: "Cannot delete the last profile",
        }),
      );
      return;
    }
    settingsStore.deleteProfile(profileId);
    toast.success(
      t("profiles.deleted", {
        fallback: 'Profile "{{name}}" deleted',
        vars: { name: profileName },
      }),
    );
  };

  const handleDownloadProfile = (profileId: string) => {
    const profile = settingsStore.exportProfile(profileId);
    if (!profile) {
      toast.error(t("profiles.notFound", { fallback: "Profile not found" }));
      return;
    }

    const fileName = `${activeApp}_profile_${profile.name}_${Date.now()}.json`;
    if (typeof overwolf === "undefined") {
      const blob = new Blob([JSON.stringify(profile, null, 2)], {
        type: "application/json",
      });
      saveFile(blob, fileName);
    } else {
      writeFileOverwolf(
        JSON.stringify(profile, null, 2),
        overwolf.io.paths.documents + "\\the-hidden-gaming-lair",
        fileName,
      );
    }
    toast.success(
      t("profiles.downloaded", {
        fallback: 'Profile "{{name}}" downloaded',
        vars: { name: profile.name },
      }),
    );
  };

  const handleUploadProfile = async () => {
    const file = await openFileOrFiles();
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", (loadEvent) => {
      const text = loadEvent.target?.result;
      if (!text || typeof text !== "string") {
        toast.error(
          t("profiles.readFileFailed", { fallback: "Failed to read file" }),
        );
        return;
      }

      try {
        const profile = JSON.parse(text) as Profile;

        // Validate profile structure
        if (
          !profile.id ||
          !profile.name ||
          !profile.settings ||
          typeof profile.createdAt !== "number" ||
          typeof profile.updatedAt !== "number"
        ) {
          toast.error(
            t("profiles.invalidFormat", { fallback: "Invalid profile format" }),
          );
          return;
        }

        settingsStore.importProfile(profile);
        toast.success(
          t("profiles.uploaded", {
            fallback: 'Profile "{{name}}" uploaded',
            vars: { name: profile.name },
          }),
        );
      } catch (error) {
        toast.error(
          t("profiles.parseFailed", {
            fallback: "Failed to parse profile file",
          }),
        );
      }
    });
    reader.readAsText(file);
  };

  const handleDuplicateProfile = () => {
    if (!duplicateProfileName.trim()) {
      toast.error(
        t("profiles.nameEmpty", { fallback: "Profile name cannot be empty" }),
      );
      return;
    }
    if (
      settingsStore.profiles.some((p) => p.name === duplicateProfileName.trim())
    ) {
      toast.error(
        t("profiles.nameExists", {
          fallback: "A profile with this name already exists",
        }),
      );
      return;
    }
    if (duplicateProfileId) {
      const sourceProfile = settingsStore.profiles.find(
        (p) => p.id === duplicateProfileId,
      );
      settingsStore.duplicateProfile(
        duplicateProfileId,
        duplicateProfileName.trim(),
      );
      setDuplicateProfileId(null);
      setDuplicateProfileName("");
      setDuplicateDialogOpen(false);
      toast.success(
        t("profiles.duplicated", {
          fallback: 'Profile "{{source}}" duplicated as "{{name}}"',
          vars: {
            source: String(sourceProfile?.name),
            name: duplicateProfileName,
          },
        }),
      );
    }
  };

  const handleDateDisplay = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 flex-nowrap">
        <Select
          value={settingsStore.currentProfileId}
          onValueChange={handleSwitchProfile}
        >
          <SelectTrigger className="min-w-0 flex-1 h-8" id="profile-select">
            <SelectValue
              placeholder={t("profiles.select", { fallback: "Select profile" })}
            />
          </SelectTrigger>
          <SelectContent>
            {settingsStore.profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-green-600 dark:text-green-400"
              title={t("profiles.createNew", {
                fallback: "Create new profile",
              })}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby="create-profile-description">
            <DialogHeader>
              <DialogTitle>
                {t("profiles.create", { fallback: "Create New Profile" })}
              </DialogTitle>
              <DialogDescription id="create-profile-description">
                {t("profiles.createDescription", {
                  fallback:
                    "Create a new profile based on your current settings.",
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-profile-name">
                  {t("profiles.name", { fallback: "Profile Name" })}
                </Label>
                <Input
                  id="new-profile-name"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder={t("profiles.namePlaceholder", {
                    fallback: "Enter profile name",
                  })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateProfile();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setNewProfileName("");
                }}
              >
                {t("common.cancel", { fallback: "Cancel" })}
              </Button>
              <Button onClick={handleCreateProfile}>
                {t("common.create", { fallback: "Create" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {currentProfile && (
          <>
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-blue-600 dark:text-blue-400"
                  title={t("profiles.renameTitle", {
                    fallback: "Rename profile",
                  })}
                  onClick={() => {
                    setEditingProfileId(currentProfile.id);
                    setEditingProfileName(currentProfile.name);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="rename-profile-description">
                <DialogHeader>
                  <DialogTitle>
                    {t("profiles.rename", { fallback: "Rename Profile" })}
                  </DialogTitle>
                  <DialogDescription id="rename-profile-description">
                    {t("profiles.renameDescription", {
                      fallback: "Enter a new name for this profile.",
                    })}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-profile-name">
                      {t("profiles.name", { fallback: "Profile Name" })}
                    </Label>
                    <Input
                      id="edit-profile-name"
                      value={editingProfileName}
                      onChange={(e) => setEditingProfileName(e.target.value)}
                      placeholder={t("profiles.namePlaceholder", {
                        fallback: "Enter profile name",
                      })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRenameProfile();
                        }
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRenameDialogOpen(false);
                      setEditingProfileId(null);
                      setEditingProfileName("");
                    }}
                  >
                    {t("common.cancel", { fallback: "Cancel" })}
                  </Button>
                  <Button onClick={handleRenameProfile}>
                    {t("common.rename", { fallback: "Rename" })}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={duplicateDialogOpen}
              onOpenChange={setDuplicateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-purple-600 dark:text-purple-400"
                  title={t("profiles.duplicateTitle", {
                    fallback: "Duplicate profile",
                  })}
                  onClick={() => {
                    setDuplicateProfileId(currentProfile.id);
                    setDuplicateProfileName(`${currentProfile.name} Copy`);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="duplicate-profile-description">
                <DialogHeader>
                  <DialogTitle>
                    {t("profiles.duplicate", { fallback: "Duplicate Profile" })}
                  </DialogTitle>
                  <DialogDescription id="duplicate-profile-description">
                    {t("profiles.duplicateDescription", {
                      fallback:
                        'Create a copy of "{{name}}" with all its settings.',
                      vars: { name: currentProfile.name },
                    })}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="duplicate-profile-name">
                      {t("profiles.name", { fallback: "Profile Name" })}
                    </Label>
                    <Input
                      id="duplicate-profile-name"
                      value={duplicateProfileName}
                      onChange={(e) => setDuplicateProfileName(e.target.value)}
                      placeholder={t("profiles.namePlaceholder", {
                        fallback: "Enter profile name",
                      })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleDuplicateProfile();
                        }
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDuplicateDialogOpen(false);
                      setDuplicateProfileId(null);
                      setDuplicateProfileName("");
                    }}
                  >
                    {t("common.cancel", { fallback: "Cancel" })}
                  </Button>
                  <Button onClick={handleDuplicateProfile}>
                    {t("common.duplicate", { fallback: "Duplicate" })}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-amber-600 dark:text-amber-400"
              title={t("profiles.download", { fallback: "Download profile" })}
              onClick={() => handleDownloadProfile(currentProfile.id)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </>
        )}

        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2 text-cyan-600 dark:text-cyan-400"
          title={t("profiles.upload", { fallback: "Upload profile" })}
          onClick={handleUploadProfile}
        >
          <Upload className="h-4 w-4" />
        </Button>

        {currentProfile && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-red-600 dark:text-red-400"
                title={
                  settingsStore.profiles.length <= 1
                    ? t("profiles.cannotDeleteLast", {
                        fallback: "Cannot delete the last profile",
                      })
                    : t("profiles.deleteTitle", {
                        fallback: "Delete profile",
                      })
                }
                disabled={settingsStore.profiles.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("profiles.delete", { fallback: "Delete Profile" })}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("profiles.deleteConfirm", {
                    fallback:
                      'Are you sure you want to delete the profile "{{name}}"? This action cannot be undone.',
                    vars: { name: currentProfile.name },
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("common.cancel", { fallback: "Cancel" })}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    handleDeleteProfile(currentProfile.id, currentProfile.name)
                  }
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("common.delete", { fallback: "Delete" })}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {currentProfile && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            {t("profiles.updatedAt", {
              fallback: "Updated: {{date}}",
              vars: { date: handleDateDisplay(currentProfile.updatedAt) },
            })}
          </p>
        </div>
      )}
    </div>
  );
}
