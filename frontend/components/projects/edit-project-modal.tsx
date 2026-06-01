"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Leaf, MapPin, FileText, TreePine, Waves } from "lucide-react";
import type { Project } from "@/lib/types";

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: ProjectFormData) => void;
  project: Project | null;
}

interface ProjectFormData {
  name: string;
  location: string;
  area: number;
  carbonCredits: number;
  description: string;
  ecosystemType: string;
  latitude: string;
  longitude: string;
}

export function EditProjectModal({
  open,
  onOpenChange,
  onSubmit,
  project,
}: EditProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    location: "",
    area: 0,
    carbonCredits: 0,
    description: "",
    ecosystemType: "",
    latitude: "",
    longitude: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({});

  // Update form when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        location: project.location,
        area: project.area,
        carbonCredits: project.carbonCredits,
        description: project.description,
        ecosystemType: project.ecosystemType,
        latitude: project.coordinates?.lat.toString() || "",
        longitude: project.coordinates?.lng.toString() || "",
      });
      setErrors({});
    }
  }, [project, open]);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ProjectFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }
    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }
    if (formData.area <= 0) {
      newErrors.area = "Area must be greater than 0";
    }
    if (formData.carbonCredits < 0) {
      newErrors.carbonCredits = "Carbon credits cannot be negative";
    }
    if (!formData.ecosystemType) {
      newErrors.ecosystemType = "Please select an ecosystem type";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Call parent handler with form data
      await onSubmit?.(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Leaf className="h-5 w-5 text-primary" />
            Edit Blue Carbon Project
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update project details. Changes will be saved to the registry.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-foreground">
                Project Name *
              </Label>
              <Input
                id="edit-name"
                placeholder="Enter project name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="edit-location" className="text-foreground">
                Location *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="edit-location"
                  placeholder="Country or region"
                  className={`pl-9 ${errors.location ? "border-destructive" : ""}`}
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              {errors.location && (
                <p className="text-xs text-destructive">{errors.location}</p>
              )}
            </div>

            {/* Ecosystem Type */}
            <div className="space-y-2">
              <Label htmlFor="edit-ecosystemType" className="text-foreground">
                Ecosystem Type *
              </Label>
              <Select
                value={formData.ecosystemType}
                onValueChange={(value) =>
                  setFormData({ ...formData, ecosystemType: value })
                }
              >
                <SelectTrigger
                  className={errors.ecosystemType ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select ecosystem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mangrove">
                    <span className="flex items-center gap-2">
                      <TreePine className="h-4 w-4 text-teal-500" />
                      Mangrove
                    </span>
                  </SelectItem>
                  <SelectItem value="seagrass">
                    <span className="flex items-center gap-2">
                      <Waves className="h-4 w-4 text-blue-500" />
                      Seagrass
                    </span>
                  </SelectItem>
                  <SelectItem value="saltmarsh">
                    <span className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-indigo-500" />
                      Saltmarsh
                    </span>
                  </SelectItem>
                  <SelectItem value="kelp">
                    <span className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-green-500" />
                      Kelp Forest
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.ecosystemType && (
                <p className="text-xs text-destructive">{errors.ecosystemType}</p>
              )}
            </div>

            {/* Area */}
            <div className="space-y-2">
              <Label htmlFor="edit-area" className="text-foreground">
                Area (hectares) *
              </Label>
              <Input
                id="edit-area"
                type="number"
                placeholder="0"
                value={formData.area || ""}
                onChange={(e) =>
                  setFormData({ ...formData, area: Number(e.target.value) })
                }
                className={errors.area ? "border-destructive" : ""}
              />
              {errors.area && (
                <p className="text-xs text-destructive">{errors.area}</p>
              )}
            </div>

            {/* Estimated Carbon Credits */}
            <div className="space-y-2">
              <Label htmlFor="edit-carbonCredits" className="text-foreground">
                Estimated Carbon Credits
              </Label>
              <Input
                id="edit-carbonCredits"
                type="number"
                placeholder="0"
                value={formData.carbonCredits || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    carbonCredits: Number(e.target.value),
                  })
                }
                className={errors.carbonCredits ? "border-destructive" : ""}
              />
              {errors.carbonCredits && (
                <p className="text-xs text-destructive">{errors.carbonCredits}</p>
              )}
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="edit-latitude" className="text-foreground">
                  Latitude
                </Label>
                <Input
                  id="edit-latitude"
                  placeholder="e.g., 21.9497"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-longitude" className="text-foreground">
                  Longitude
                </Label>
                <Input
                  id="edit-longitude"
                  placeholder="e.g., 89.1833"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-foreground">
              Project Description *
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="edit-description"
                placeholder="Describe the blue carbon project, its objectives, and environmental impact..."
                className={`min-h-[100px] pl-9 ${
                  errors.description ? "border-destructive" : ""
                }`}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
