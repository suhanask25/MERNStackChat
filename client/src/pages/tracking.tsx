import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Activity, Heart } from "lucide-react";
import type { MedicalParameter, MedicalReport } from "@shared/schema";
import { format } from "date-fns";

export default function Tracking() {
  const { data: reports, isLoading: reportsLoading } = useQuery<MedicalReport[]>({
    queryKey: ['/api/reports'],
  });

  const { data: allParameters, isLoading: parametersLoading } = useQuery<MedicalParameter[]>({
    queryKey: ['/api/parameters/all'],
  });

  const groupParametersByName = () => {
    if (!allParameters || !reports) return {};

    const grouped: Record<string, Array<{ date: string; value: number; reportId: string; status?: string }>> = {};

    allParameters.forEach((param) => {
      const report = reports.find(r => r.id === param.reportId);
      if (!report) return;

      if (!grouped[param.parameterName]) {
        grouped[param.parameterName] = [];
      }

      const numericValue = parseFloat(param.value);
      if (!isNaN(numericValue)) {
        grouped[param.parameterName].push({
          date: format(new Date(param.extractedAt), 'MMM dd, yyyy'),
          value: numericValue,
          reportId: param.reportId,
          status: param.status || undefined,
        });
      }
    });

    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return grouped;
  };

  const parameterGroups = groupParametersByName();
  const conditions = ['PCOS/PCOD', 'Thyroid', 'Hormones'];

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'PCOS/PCOD': return <Activity className="h-5 w-5" />;
      case 'Thyroid': return <Heart className="h-5 w-5" />;
      default: return <TrendingUp className="h-5 w-5" />;
    }
  };

  const getRelevantParameters = (condition: string) => {
    switch (condition) {
      case 'PCOS/PCOD':
        return Object.keys(parameterGroups).filter(name =>
          name.toLowerCase().includes('testosterone') ||
          name.toLowerCase().includes('lh') ||
          name.toLowerCase().includes('fsh') ||
          name.toLowerCase().includes('insulin')
        );
      case 'Thyroid':
        return Object.keys(parameterGroups).filter(name =>
          name.toLowerCase().includes('tsh') ||
          name.toLowerCase().includes('t3') ||
          name.toLowerCase().includes('t4')
        );
      case 'Hormones':
        return Object.keys(parameterGroups).filter(name =>
          name.toLowerCase().includes('estrogen') ||
          name.toLowerCase().includes('progesterone') ||
          name.toLowerCase().includes('prolactin')
        );
      default:
        return [];
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-foreground mb-2" data-testid="text-tracking-title">Condition Tracking</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Monitor your health parameters over time and identify trends
        </p>
      </div>

      <Tabs defaultValue="PCOS/PCOD" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3" data-testid="tabs-conditions">
          {conditions.map((condition) => (
            <TabsTrigger key={condition} value={condition} data-testid={`tab-${condition.toLowerCase().replace(/\//g, '-')}`}>
              {condition}
            </TabsTrigger>
          ))}
        </TabsList>

        {conditions.map((condition) => {
          const relevantParams = getRelevantParameters(condition);

          return (
            <TabsContent key={condition} value={condition} className="space-y-6">
              <Card data-testid={`card-${condition.toLowerCase().replace(/\//g, '-')}`}>
                <CardHeader className="flex flex-row flex-wrap items-center gap-2 space-y-0 pb-4">
                  <div className="flex items-center gap-2">
                    {getConditionIcon(condition)}
                    <CardTitle className="text-xl font-medium">{condition} Markers</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-sm ml-auto">
                    {relevantParams.length} parameters tracked
                  </Badge>
                </CardHeader>
                <CardContent>
                  {parametersLoading || reportsLoading ? (
                    <Skeleton className="h-80 w-full" />
                  ) : relevantParams.length > 0 ? (
                    <div className="space-y-8">
                      {relevantParams.map((paramName) => {
                        const data = parameterGroups[paramName];
                        if (!data || data.length === 0) return null;

                        return (
                          <div key={paramName} className="space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <h3 className="text-lg font-medium text-foreground">{paramName}</h3>
                              {data[data.length - 1].status && (
                                <Badge
                                  variant={data[data.length - 1].status?.toLowerCase() === 'normal' ? 'secondary' : 'destructive'}
                                  className="text-xs"
                                >
                                  Latest: {data[data.length - 1].status}
                                </Badge>
                              )}
                            </div>
                            <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                  <XAxis
                                    dataKey="date"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                  />
                                  <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: 'hsl(var(--popover))',
                                      border: '1px solid hsl(var(--border))',
                                      borderRadius: '6px',
                                      color: 'hsl(var(--popover-foreground))',
                                    }}
                                  />
                                  <Legend />
                                  <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                                    activeDot={{ r: 6 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 space-y-4">
                      <div className="flex justify-center">
                        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                          {getConditionIcon(condition)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-foreground">No {condition} data yet</p>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Upload medical reports with {condition}-related parameters to start tracking trends
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
