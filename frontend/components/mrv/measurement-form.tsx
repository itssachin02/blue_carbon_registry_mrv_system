"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, TrendingUp, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  _id: string;
  name: string;
  location: string;
  area: number;
  ecosystemType: string;
}

export function MeasurementForm({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [formData, setFormData] = useState({
    projectId: "",
    measurementDate: new Date().toISOString().split("T")[0],
    dataSource: "combined",
    areaMonitored: "",
    growthRate: "",
    co2AbsorptionRate: "",
    sensorData: {
      temperature: "",
      humidity: "",
      soilMoisture: "",
      biomass: "",
    },
    satelliteImagery: {
      source: "",
      resolution: "",
      captureDate: "",
      url: "",
    },
    manualData: {
      notes: "",
      fieldTeam: "",
    },
  });

  const [calculatedValues, setCalculatedValues] = useState({
    co2Absorbed: 0,
    carbonCredits: 0,
  });

  // Fetch user projects
  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!formData.projectId) return;

    const selectedProject = projects.find(
      (project) => project._id === formData.projectId
    );

    if (selectedProject && !formData.areaMonitored) {
      setFormData((prev) => ({
        ...prev,
        areaMonitored: String(selectedProject.area || ""),
      }));
    }
  }, [formData.projectId, projects]);

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects?userId=${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Calculate CO2 when measurement values change
  useEffect(() => {
    if (
      formData.areaMonitored &&
      formData.growthRate &&
      formData.co2AbsorptionRate
    ) {
      // Formula: CO₂ = Area × Growth Rate × CO2 Rate × Conversion Factor (3.67)
      const area = parseFloat(formData.areaMonitored);
      const growthRate = parseFloat(formData.growthRate);
      const co2Rate = parseFloat(formData.co2AbsorptionRate);
      const conversionFactor = 3.67;

      const co2Absorbed =
        (area * (growthRate / 100) * co2Rate * conversionFactor).toFixed(2);
      const carbonCredits = Math.floor(parseFloat(co2Absorbed));

      setCalculatedValues({
        co2Absorbed: parseFloat(co2Absorbed),
        carbonCredits,
      });
    }
  }, [
    formData.areaMonitored,
    formData.growthRate,
    formData.co2AbsorptionRate,
  ]);

  const handleSubmit = async () => {
    if (!formData.projectId) {
      alert("Please select a project");
      return;
    }

    if (!formData.areaMonitored || !formData.growthRate || !formData.co2AbsorptionRate) {
      alert("Please fill in all required measurement fields");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const payload = {
        projectId: formData.projectId,
        measurementDate: formData.measurementDate,
        areaMonitored: parseFloat(formData.areaMonitored),
        growthRate: parseFloat(formData.growthRate),
        co2AbsorptionRate: parseFloat(formData.co2AbsorptionRate),
        dataSource: formData.dataSource,
        ...(formData.dataSource === "sensor" || formData.dataSource === "combined"
          ? {
              sensorData: {
                temperature: formData.sensorData.temperature ? parseFloat(formData.sensorData.temperature) : undefined,
                humidity: formData.sensorData.humidity ? parseFloat(formData.sensorData.humidity) : undefined,
                soilMoisture: formData.sensorData.soilMoisture ? parseFloat(formData.sensorData.soilMoisture) : undefined,
                biomass: formData.sensorData.biomass ? parseFloat(formData.sensorData.biomass) : undefined,
              },
            }
          : {}),
        ...(formData.dataSource === "satellite" || formData.dataSource === "combined"
          ? {
              satelliteImagery: {
                source: formData.satelliteImagery.source || undefined,
                resolution: formData.satelliteImagery.resolution || undefined,
                captureDate: formData.satelliteImagery.captureDate || undefined,
                url: formData.satelliteImagery.url || undefined,
              },
            }
          : {}),
        ...(formData.dataSource === "manual" || formData.dataSource === "combined"
          ? {
              manualData: {
                notes: formData.manualData.notes || undefined,
                fieldTeam: formData.manualData.fieldTeam || undefined,
              },
            }
          : {}),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/mrv/measurement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const measurement = data.measurement;
        let reportGenerated = false;
        let reportErrorMessage = "";

        if (measurement && measurement._id) {
          const reportResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/mrv/measurement/${measurement._id}/report`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                reportType: "monitoring",
                methodology: "Auto-generated monitoring report",
                notes: `Auto-generated report from measurement ${measurement._id}`,
              }),
            }
          );

          const reportData = await reportResponse.json();
          if (reportResponse.ok) {
            reportGenerated = true;
          } else {
            reportErrorMessage = reportData.error || "Failed to auto-generate report";
          }
        }

        if (reportGenerated) {
          alert("✅ Measurement recorded and MRV report auto-generated!");
        } else {
          alert(
            `✅ Measurement recorded successfully! ${reportErrorMessage ? `Report error: ${reportErrorMessage}` : "Report generation was skipped."}`
          );
        }

        setOpen(false);
        setFormData({
          projectId: "",
          measurementDate: new Date().toISOString().split("T")[0],
          dataSource: "combined",
          areaMonitored: "",
          growthRate: "",
          co2AbsorptionRate: "",
          sensorData: {
            temperature: "",
            humidity: "",
            soilMoisture: "",
            biomass: "",
          },
          satelliteImagery: {
            source: "",
            resolution: "",
            captureDate: "",
            url: "",
          },
          manualData: {
            notes: "",
            fieldTeam: "",
          },
        });
        onSuccess();
      } else {
        alert(`Error: ${data.error || "Failed to record measurement"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error recording measurement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" size="lg">
          <Plus className="h-5 w-5" />
          Record Measurement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record New Measurement (MRV Data Collection)</DialogTitle>
          <DialogDescription>
            Enter measurement data for your project. CO₂ absorption and MRV report creation are automated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">Select Project *</Label>
            <Select value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projectsLoading ? (
                  <SelectItem disabled value="loading">Loading projects...</SelectItem>
                ) : projects.length === 0 ? (
                  <SelectItem disabled value="none">No projects found</SelectItem>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.name} ({project.ecosystemType})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Measurement Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Measurement Date *</Label>
            <Input
              type="date"
              value={formData.measurementDate}
              onChange={(e) =>
                setFormData({ ...formData, measurementDate: e.target.value })
              }
            />
          </div>

          {/* Data Source */}
          <div className="space-y-2">
            <Label>Data Source *</Label>
            <Select value={formData.dataSource} onValueChange={(value) => setFormData({ ...formData, dataSource: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sensor">Sensor Data</SelectItem>
                <SelectItem value="satellite">Satellite Imagery</SelectItem>
                <SelectItem value="manual">Manual Inspection</SelectItem>
                <SelectItem value="combined">Combined Sources</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Core Measurement Fields */}
          <Card className="bg-secondary/30 border-secondary">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                Core Measurements *
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Area Monitored (hectares)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 50"
                    step="0.01"
                    value={formData.areaMonitored}
                    onChange={(e) =>
                      setFormData({ ...formData, areaMonitored: e.target.value })
                    }
                  />
                  {formData.projectId && (
                    <p className="text-xs text-muted-foreground">
                      Project area is auto-filled from the selected project. Edit manually if measurement area differs.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="growth">Growth Rate (%)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 5"
                    step="0.1"
                    value={formData.growthRate}
                    onChange={(e) =>
                      setFormData({ ...formData, growthRate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="co2">CO₂ Rate (t/ha/year)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2.5"
                    step="0.01"
                    value={formData.co2AbsorptionRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        co2AbsorptionRate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculated Results */}
          {calculatedValues.co2Absorbed > 0 && (
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">CO₂ Absorbed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {calculatedValues.co2Absorbed.toLocaleString()} tCO₂e
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Carbon Credits</p>
                    <p className="text-2xl font-bold text-green-600">
                      {calculatedValues.carbonCredits.toLocaleString()} credits
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sensor Data (if selected) */}
          {(formData.dataSource === "sensor" || formData.dataSource === "combined") && (
            <Card className="bg-secondary/30">
              <CardHeader>
                <CardTitle className="text-base">Sensor Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="temp" className="text-xs">Temperature (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="25.5"
                      value={formData.sensorData.temperature}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sensorData: { ...formData.sensorData, temperature: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="humidity" className="text-xs">Humidity (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="65"
                      value={formData.sensorData.humidity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sensorData: { ...formData.sensorData, humidity: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="soil" className="text-xs">Soil Moisture (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="45"
                      value={formData.sensorData.soilMoisture}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sensorData: { ...formData.sensorData, soilMoisture: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="biomass" className="text-xs">Biomass (tonnes)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="150"
                      value={formData.sensorData.biomass}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sensorData: { ...formData.sensorData, biomass: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Data Notes */}
          {(formData.dataSource === "manual" || formData.dataSource === "combined") && (
            <Card className="bg-secondary/30">
              <CardHeader>
                <CardTitle className="text-base">Field Inspection Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="team" className="text-xs">Field Team</Label>
                  <Input
                    placeholder="e.g. Team A, Environmental Assessment Team"
                    value={formData.manualData.fieldTeam}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        manualData: { ...formData.manualData, fieldTeam: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs">Observations & Notes</Label>
                  <Textarea
                    placeholder="Record any observations, challenges, or additional notes..."
                    rows={3}
                    value={formData.manualData.notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        manualData: { ...formData.manualData, notes: e.target.value },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record & Calculate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
