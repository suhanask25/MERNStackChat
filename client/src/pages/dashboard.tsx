import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Droplets, Dumbbell, Pill, Beef, TrendingUp, AlertCircle, CheckCircle2, Activity } from "lucide-react";
import type { RiskScore, DailyTask, Insight, MedicalParameter } from "@shared/schema";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const { data: riskScore, isLoading: riskLoading } = useQuery<RiskScore>({
    queryKey: ['/api/risk-score'],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<DailyTask[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: insights, isLoading: insightsLoading } = useQuery<Insight[]>({
    queryKey: ['/api/insights'],
  });

  const { data: parameters, isLoading: parametersLoading } = useQuery<MedicalParameter[]>({
    queryKey: ['/api/parameters/latest'],
  });

  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (tasks) {
      const completed = new Set<string>();
      tasks.forEach(task => {
        if (task.completed === 1) {
          completed.add(task.id);
        }
      });
      setCompletedTasks(completed);
    }
  }, [tasks]);

  const toggleTask = async (taskId: string) => {
    const newCompleted = new Set(completedTasks);
    const isCompleted = !newCompleted.has(taskId);
    
    try {
      const response = await apiRequest('PATCH', `/api/tasks/${taskId}`, { completed: isCompleted });
      await response.json();
      
      if (isCompleted) {
        newCompleted.add(taskId);
      } else {
        newCompleted.delete(taskId);
      }
      setCompletedTasks(newCompleted);
      
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    } catch (error) {
      console.error('Task toggle error:', error);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'water': return <Droplets className="h-5 w-5" />;
      case 'exercise': return <Dumbbell className="h-5 w-5" />;
      case 'medication': return <Pill className="h-5 w-5" />;
      case 'protein': return <Beef className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-chart-2';
      case 'moderate': return 'text-chart-5';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (level: string): "default" | "secondary" | "destructive" => {
    switch (level.toLowerCase()) {
      case 'high': return 'destructive';
      case 'moderate': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-foreground mb-2" data-testid="text-dashboard-title">Your Health Dashboard</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Track your health metrics, complete daily wellness tasks, and view AI-powered insights
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1" data-testid="card-risk-score">
          <CardHeader className="space-y-0 pb-4">
            <CardTitle className="text-xl font-medium">Risk Score</CardTitle>
            <CardDescription>Based on your latest report and assessment</CardDescription>
          </CardHeader>
          <CardContent>
            {riskLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            ) : riskScore ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Progress value={riskScore.score} className="h-2 w-32" />
                    <div className={`text-6xl font-bold ${getRiskColor(riskScore.riskLevel)} mt-4`} data-testid="text-risk-score">
                      {riskScore.score}
                    </div>
                  </div>
                  <Badge variant={getRiskBadgeVariant(riskScore.riskLevel)} className="text-sm" data-testid={`badge-risk-${riskScore.riskLevel.toLowerCase()}`}>
                    {riskScore.riskLevel} Risk
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed text-center">
                  {riskScore.interpretation}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Upload a medical report and complete the assessment to see your risk score
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2" data-testid="card-daily-tasks">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl font-medium">Daily Wellness Tasks</CardTitle>
              <CardDescription>Complete your personalized health goals</CardDescription>
            </div>
            {tasks && tasks.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {completedTasks.size} of {tasks.length} completed
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-4 p-4 rounded-md border transition-colors ${
                      completedTasks.has(task.id) ? 'bg-muted/50' : 'bg-card'
                    }`}
                    data-testid={`task-item-${task.id}`}
                  >
                    <Checkbox
                      checked={completedTasks.has(task.id)}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="mt-1"
                      data-testid={`checkbox-task-${task.id}`}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {getTaskIcon(task.taskType)}
                        <span className={`font-medium ${completedTasks.has(task.id) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.description}
                        </span>
                      </div>
                      {task.target && (
                        <p className="text-sm text-muted-foreground">
                          Target: {task.target}
                        </p>
                      )}
                    </div>
                    {completedTasks.has(task.id) && (
                      <CheckCircle2 className="h-5 w-5 text-chart-2 mt-1" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Your personalized daily tasks will appear here after uploading a report
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-key-metrics">
          <CardHeader className="space-y-0 pb-4">
            <CardTitle className="text-xl font-medium">Key Health Metrics</CardTitle>
            <CardDescription>Latest extracted parameters from your report</CardDescription>
          </CardHeader>
          <CardContent>
            {parametersLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : parameters && parameters.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {parameters.map((param) => (
                  <div
                    key={param.id}
                    className="p-4 rounded-md border bg-card space-y-2"
                    data-testid={`parameter-${param.id}`}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {param.parameterName}
                    </p>
                    <p className="text-2xl font-semibold text-foreground">
                      {param.value} {param.unit && <span className="text-base text-muted-foreground">{param.unit}</span>}
                    </p>
                    {param.referenceRange && (
                      <p className="text-xs text-muted-foreground">
                        Range: {param.referenceRange}
                      </p>
                    )}
                    {param.status && (
                      <Badge
                        variant={param.status.toLowerCase() === 'normal' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {param.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Upload a medical report to see your key health metrics
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-insights">
          <CardHeader className="space-y-0 pb-4">
            <CardTitle className="text-xl font-medium">AI-Powered Insights</CardTitle>
            <CardDescription>Personalized health recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : insights && insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className="p-4 rounded-md border bg-card space-y-2"
                    data-testid={`insight-${insight.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{insight.title}</p>
                      {insight.severity && (
                        <Badge variant="secondary" className="text-xs">
                          {insight.severity}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {insight.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Complete your health assessment to receive personalized insights
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
