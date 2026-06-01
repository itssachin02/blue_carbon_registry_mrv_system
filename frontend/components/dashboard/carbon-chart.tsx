"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { carbonSequestrationData } from "@/lib/mock-data";

export function CarbonChart() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Carbon Sequestration Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={carbonSequestrationData}>
              <defs>
                <linearGradient id="colorMangrove" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSeagrass" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSaltmarsh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorKelp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#f9fafb",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="mangrove"
                stroke="#2dd4bf"
                fillOpacity={1}
                fill="url(#colorMangrove)"
                name="Mangrove"
              />
              <Area
                type="monotone"
                dataKey="seagrass"
                stroke="#38bdf8"
                fillOpacity={1}
                fill="url(#colorSeagrass)"
                name="Seagrass"
              />
              <Area
                type="monotone"
                dataKey="saltmarsh"
                stroke="#818cf8"
                fillOpacity={1}
                fill="url(#colorSaltmarsh)"
                name="Saltmarsh"
              />
              <Area
                type="monotone"
                dataKey="kelp"
                stroke="#4ade80"
                fillOpacity={1}
                fill="url(#colorKelp)"
                name="Kelp"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
