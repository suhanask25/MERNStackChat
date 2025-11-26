import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Droplets, Dumbbell, Pill, Beef, TrendingUp, AlertCircle, CheckCircle2, Activity, 
  Calendar, MapPin, Heart, Flame, Footprints, Brain, Apple, Watch, MessageCircle, Plus
} from "lucide-react";
import type { RiskScore, DailyTask, Insight, MedicalParameter } from "@shared/schema";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [waterToday, setWaterToday] = useState(0);
  const [stepsToday, setStepsToday] = useState(0);
  const [waterInput, setWaterInput] = useState("");
  const [stepsInput, setStepsInput] = useState("");
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Queries
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
      await apiRequest('PATCH', `/api/tasks/${taskId}`, { completed: isCompleted });
      if (isCompleted) {
        newCompleted.add(taskId);
      } else {
        newCompleted.delete(taskId);
      }
      setCompletedTasks(newCompleted);
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    } catch (error) {
      console.error('Task toggle error:', error);
    }
  };

  const addWater = () => {
    const amount = parseInt(waterInput);
    if (amount > 0) {
      setWaterToday(waterToday + amount);
      setWaterInput("");
      toast({ title: "✓ Water logged", description: `${amount}ml added to today's intake` });
    }
  };

  const addSteps = () => {
    const steps = parseInt(stepsInput);
    if (steps > 0) {
      setStepsToday(stepsToday + steps);
      setStepsInput("");
      toast({ title: "✓ Steps logged", description: `${steps} steps added` });
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

  const waterGoal = 2000;
  const stepsGoal = 10000;
  const cycleDay = 14;
  const cycleDays = 28;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold text-foreground mb-2" data-testid="text-dashboard-title">
          Your Health Dashboard
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Track your wellness metrics, complete daily goals, and manage your health journey
        </p>
      </div>

      {/* Top Row: Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Risk Score */}
        <Card data-testid="card-risk-score">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" /> Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {riskLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : riskScore ? (
              <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">{riskScore.score}/100</div>
                <Badge variant={getRiskBadgeVariant(riskScore.riskLevel)} className="text-xs">
                  {riskScore.riskLevel} Risk
                </Badge>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Upload report to see</p>
            )}
          </CardContent>
        </Card>

        {/* Water Intake */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" /> Water Intake
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold">{waterToday}</span>
                <span className="text-xs text-muted-foreground">/ {waterGoal}ml</span>
              </div>
              <Progress value={(waterToday / waterGoal) * 100} className="h-2" />
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="ml"
                value={waterInput}
                onChange={(e) => setWaterInput(e.target.value)}
                className="h-8 text-xs"
              />
              <Button onClick={addWater} size="sm" className="h-8 px-2">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Footprints className="h-4 w-4 text-orange-500" /> Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold">{stepsToday}</span>
                <span className="text-xs text-muted-foreground">/ {stepsGoal}</span>
              </div>
              <Progress value={(stepsToday / stepsGoal) * 100} className="h-2" />
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="steps"
                value={stepsInput}
                onChange={(e) => setStepsInput(e.target.value)}
                className="h-8 text-xs"
              />
              <Button onClick={addSteps} size="sm" className="h-8 px-2">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Period Cycle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-rose-500" /> Period Cycle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold">Day {cycleDay}</span>
                <span className="text-xs text-muted-foreground">of {cycleDays}</span>
              </div>
              <Progress value={(cycleDay / cycleDays) * 100} className="h-2" />
            </div>
            <Button size="sm" variant="outline" className="w-full text-xs h-8">
              Log Period
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily Wellness Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Daily Wellness Tasks</CardTitle>
                  <CardDescription>Complete your personalized health goals</CardDescription>
                </div>
              </div>
              {tasks && tasks.length > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {completedTasks.size} of {tasks.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
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
                  >
                    <Checkbox
                      checked={completedTasks.has(task.id)}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {getTaskIcon(task.taskType)}
                        <span className={`font-medium ${completedTasks.has(task.id) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.description}
                        </span>
                      </div>
                      {task.target && (
                        <p className="text-sm text-muted-foreground">Target: {task.target}</p>
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

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Access key features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2 text-sm h-auto py-3">
              <Dumbbell className="h-4 w-4" />
              <span className="text-left">
                <div className="font-medium">Exercises Portal</div>
                <div className="text-xs text-muted-foreground">Find workouts for you</div>
              </span>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 text-sm h-auto py-3">
              <Brain className="h-4 w-4" />
              <span className="text-left">
                <div className="font-medium">Health Calculator</div>
                <div className="text-xs text-muted-foreground">BMI, BMR, TDEE & more</div>
              </span>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 text-sm h-auto py-3">
              <MapPin className="h-4 w-4" />
              <span className="text-left">
                <div className="font-medium">Nearby Hospitals</div>
                <div className="text-xs text-muted-foreground">Find emergency care</div>
              </span>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 text-sm h-auto py-3">
              <MessageCircle className="h-4 w-4" />
              <span className="text-left">
                <div className="font-medium">AI Chatbot</div>
                <div className="text-xs text-muted-foreground">Ask health questions</div>
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Health Metrics & Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Key Health Metrics
            </CardTitle>
            <CardDescription>Latest extracted parameters from your report</CardDescription>
          </CardHeader>
          <CardContent>
            {parametersLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : parameters && parameters.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {parameters.slice(0, 4).map((param) => (
                  <div key={param.id} className="p-3 rounded-md border bg-muted/30 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">{param.parameterName}</p>
                    <p className="text-xl font-semibold text-foreground">
                      {param.value} <span className="text-sm text-muted-foreground">{param.unit}</span>
                    </p>
                    {param.status && (
                      <Badge variant={param.status.toLowerCase() === 'normal' ? 'secondary' : 'destructive'} className="text-xs">
                        {param.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Upload a medical report to see your health metrics</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>Personalized health recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : insights && insights.length > 0 ? (
              <div className="space-y-3">
                {insights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="p-3 rounded-md border bg-muted/30 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-foreground">{insight.title}</p>
                      {insight.severity && (
                        <Badge variant="secondary" className="text-xs whitespace-nowrap">
                          {insight.severity}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{insight.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Complete your health assessment to get insights</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Lightbulb } from "lucide-react";
