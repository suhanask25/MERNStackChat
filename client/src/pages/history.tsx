import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, TrendingUp, Eye, Upload as UploadIcon } from "lucide-react";
import { useLocation } from "wouter";
import type { MedicalReport } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function History() {
  const [, setLocation] = useLocation();
  
  const { data: reports, isLoading } = useQuery<MedicalReport[]>({
    queryKey: ['/api/reports'],
  });

  const getFileTypeIcon = (type: string) => {
    return type === 'application/pdf' ? (
      <FileText className="h-5 w-5" />
    ) : (
      <FileText className="h-5 w-5" />
    );
  };

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-foreground mb-2" data-testid="text-history-title">Report History</h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            View and track all your uploaded medical reports
          </p>
        </div>
        <Button onClick={() => setLocation('/upload')} size="default" data-testid="button-upload-new">
          <UploadIcon className="h-4 w-4 mr-2" />
          Upload New Report
        </Button>
      </div>

      <Card data-testid="card-reports">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Your Reports</CardTitle>
          <CardDescription>
            All your medical reports and analysis results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center gap-4 p-4 rounded-md border bg-card hover-elevate transition-colors"
                  data-testid={`report-${report.id}`}
                >
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary flex-shrink-0">
                    {getFileTypeIcon(report.fileType)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-medium text-foreground truncate" data-testid={`text-filename-${report.id}`}>
                      {report.fileName}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(report.uploadedAt)}
                      </span>
                      <Badge
                        variant={report.analysisComplete ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {report.analysisComplete ? 'Analyzed' : 'Processing'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => setLocation(`/tracking?reportId=${report.id}`)}
                      variant="outline"
                      size="icon"
                      data-testid={`button-view-${report.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">No reports yet</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Upload your first medical report to start tracking your health and receiving personalized insights
                </p>
              </div>
              <Button onClick={() => setLocation('/upload')} size="default" data-testid="button-upload-first">
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Your First Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
