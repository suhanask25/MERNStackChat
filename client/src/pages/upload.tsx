import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload as UploadIcon, FileText, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, JPG, or PNG file",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/reports/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      setUploadProgress(100);
      setUploadComplete(true);

      toast({
        title: "Upload successful!",
        description: "Your medical report is being analyzed. This may take a moment.",
      });

      setTimeout(() => {
        setLocation('/assessment');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = () => {
    if (!file) return <UploadIcon className="h-12 w-12" />;
    return file.type === 'application/pdf' ? (
      <FileText className="h-12 w-12" />
    ) : (
      <ImageIcon className="h-12 w-12" />
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-foreground mb-2" data-testid="text-upload-title">Upload Medical Report</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Upload your medical report for AI-powered analysis. We support PDF and image files.
        </p>
      </div>

      <Card data-testid="card-upload">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Select Your Report</CardTitle>
          <CardDescription>
            Supported formats: PDF, JPG, PNG (Max size: 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className={`relative border-2 border-dashed rounded-md transition-all min-h-96 flex flex-col items-center justify-center p-8 ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover-elevate'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-testid="dropzone-upload"
          >
            {uploadComplete ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-chart-2 mx-auto" />
                <div>
                  <p className="text-xl font-medium text-foreground">Upload Complete!</p>
                  <p className="text-sm text-muted-foreground mt-2">Redirecting to assessment...</p>
                </div>
              </div>
            ) : file ? (
              <div className="text-center space-y-4 w-full max-w-md">
                <div className="text-primary">
                  {getFileIcon()}
                </div>
                <div>
                  <p className="font-medium text-foreground" data-testid="text-filename">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {isUploading ? (
                  <div className="space-y-3">
                    <Progress value={uploadProgress} className="h-2" data-testid="progress-upload" />
                    <p className="text-sm text-muted-foreground">
                      {uploadProgress < 100 ? 'Uploading and analyzing...' : 'Processing complete'}
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button onClick={handleUpload} size="default" data-testid="button-upload">
                      Upload & Analyze
                    </Button>
                    <Button
                      onClick={() => setFile(null)}
                      variant="outline"
                      size="default"
                      data-testid="button-remove"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-muted-foreground">
                  <UploadIcon className="h-16 w-16 mx-auto" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground mb-2">
                    Drag and drop your medical report here
                  </p>
                  <p className="text-sm text-muted-foreground">or</p>
                </div>
                <div>
                  <input
                    type="file"
                    id="file-input"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    data-testid="input-file"
                  />
                  <Button
                    onClick={() => document.getElementById('file-input')?.click()}
                    size="default"
                    data-testid="button-browse"
                  >
                    Browse Files
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            <div className="flex items-start gap-3 p-4 rounded-md bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">AI-Powered Analysis</p>
                <p className="text-muted-foreground">Extract key medical parameters automatically</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-md bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Secure & Private</p>
                <p className="text-muted-foreground">Your data is encrypted and protected</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-md bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Instant Results</p>
                <p className="text-muted-foreground">Get personalized insights in seconds</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
