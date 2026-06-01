"use client";

import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Leaf, FileText, Cloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: ProjectFormData, file?: File) => void;
}

interface ProjectFormData {
  name: string;
  description: string;
  country: string;
  region: string;
  latitude: string;
  longitude: string;
  ecosystemType: string;
  area: string;
  carbonCredits: string;
}

export function AddProjectModal({
  open,
  onOpenChange,
  onSubmit,
}: AddProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    country: "",
    region: "",
    latitude: "",
    longitude: "",
    ecosystemType: "",
    area: "",
    carbonCredits: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({});

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ProjectFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Project description is required";
    }
    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }
    if (!formData.region.trim()) {
      newErrors.region = "Location/region is required";
    }
    if (!formData.ecosystemType) {
      newErrors.ecosystemType = "Please select an ecosystem type";
    }
    if (!formData.area.trim() || Number.isNaN(Number(formData.area)) || Number(formData.area) <= 0) {
      newErrors.area = "Valid area size is required";
    }
    if (!formData.latitude.trim() || Number.isNaN(Number(formData.latitude))) {
      newErrors.latitude = "Valid latitude is required";
    }
    if (!formData.longitude.trim() || Number.isNaN(Number(formData.longitude))) {
      newErrors.longitude = "Valid longitude is required";
    }
    if (!formData.carbonCredits.trim() || Number(formData.carbonCredits) < 0) {
      newErrors.carbonCredits = "Estimated carbon captured is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: `${formData.region.trim()}, ${formData.country.trim()}`,
        area: Number(formData.area),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        ecosystemType: formData.ecosystemType,
        carbonCredits: Number(formData.carbonCredits),
      };

      await onSubmit?.(payload, file || undefined);
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        country: "",
        region: "",
        latitude: "",
        longitude: "",
        ecosystemType: "",
        area: "",
        carbonCredits: "",
      });
      setFile(null);
      setErrors({});
      onOpenChange(false);
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
            Add New Blue Carbon Project
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Register a new blue carbon project to the blockchain registry.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Project Name *
              </Label>
              <Input
                id="name"
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

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">
                Project Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the project and its goals"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country" className="text-foreground">
                Country *
              </Label>
              <Input
                id="country"
                placeholder="Enter country"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className={errors.country ? "border-destructive" : ""}
              />
              {errors.country && (
                <p className="text-xs text-destructive">{errors.country}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="region" className="text-foreground">
                Location / Region *
              </Label>
              <Input
                id="region"
                placeholder="Enter project location"
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                className={errors.region ? "border-destructive" : ""}
              />
              {errors.region && (
                <p className="text-xs text-destructive">{errors.region}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ecosystemType" className="text-foreground">
                Ecosystem Type *
              </Label>
              <Select
                value={formData.ecosystemType}
                onValueChange={(value) =>
                  setFormData({ ...formData, ecosystemType: value })
                }
              >
                <SelectTrigger className={errors.ecosystemType ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select ecosystem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mangrove">Mangrove</SelectItem>
                  <SelectItem value="seagrass">Seagrass</SelectItem>
                  <SelectItem value="saltmarsh">Salt Marsh</SelectItem>
                  <SelectItem value="kelp">Kelp Forest</SelectItem>
                </SelectContent>
              </Select>
              {errors.ecosystemType && (
                <p className="text-xs text-destructive">{errors.ecosystemType}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="area" className="text-foreground">
                Area Size (hectares) *
              </Label>
              <Input
                id="area"
                type="number"
                placeholder="Enter area size"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className={errors.area ? "border-destructive" : ""}
                step="0.01"
                min="0"
              />
              {errors.area && (
                <p className="text-xs text-destructive">{errors.area}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude" className="text-foreground">
                Latitude *
              </Label>
              <Input
                id="latitude"
                type="number"
                placeholder="Enter latitude"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value })
                }
                className={errors.latitude ? "border-destructive" : ""}
                step="0.000001"
              />
              {errors.latitude && (
                <p className="text-xs text-destructive">{errors.latitude}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude" className="text-foreground">
                Longitude *
              </Label>
              <Input
                id="longitude"
                type="number"
                placeholder="Enter longitude"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value })
                }
                className={errors.longitude ? "border-destructive" : ""}
                step="0.000001"
              />
              {errors.longitude && (
                <p className="text-xs text-destructive">{errors.longitude}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carbonCredits" className="text-foreground">
              Estimated Carbon Captured (metric tons CO₂e) *
            </Label>
            <Input
              id="carbonCredits"
              type="number"
              placeholder="Enter estimated carbon credits"
              value={formData.carbonCredits}
              onChange={(e) =>
                setFormData({ ...formData, carbonCredits: e.target.value })
              }
              className={errors.carbonCredits ? "border-destructive" : ""}
              step="0.01"
              min="0"
            />
            {errors.carbonCredits && (
              <p className="text-xs text-destructive">{errors.carbonCredits}</p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file" className="text-foreground flex items-center gap-2">
              <Cloud className="h-4 w-4 text-primary" />
              Upload Dataset / Document
            </Label>
            <p className="text-xs text-muted-foreground">
              Upload one proof file (image, PDF, Excel or document). You can update or add more later.
            </p>
            {!file ? (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.zip"
                />
                <label htmlFor="file" className="cursor-pointer">
                  <Cloud className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload dataset or document
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, ZIP
                  </p>
                </label>
              </div>
            ) : (
              <div className="bg-primary/10 border border-primary/50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={loading}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
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
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
