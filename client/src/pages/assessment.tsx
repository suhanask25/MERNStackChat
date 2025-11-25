import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Question {
  id: string;
  question: string;
  type: 'choice' | 'scale';
  options?: string[];
  min?: number;
  max?: number;
  label?: string;
}

const questions: Question[] = [
  {
    id: 'irregular_periods',
    question: 'How would you describe your menstrual cycle regularity?',
    type: 'choice',
    options: ['Very regular (28-32 days)', 'Somewhat irregular (varies by 5-7 days)', 'Very irregular (unpredictable)', 'Absent periods'],
  },
  {
    id: 'cycle_length',
    question: 'What is your average cycle length?',
    type: 'choice',
    options: ['Less than 21 days', '21-35 days (normal)', '36-60 days', 'More than 60 days'],
  },
  {
    id: 'hair_growth',
    question: 'Do you experience excessive hair growth (face, chest, back)?',
    type: 'choice',
    options: ['No', 'Mild', 'Moderate', 'Severe'],
  },
  {
    id: 'acne',
    question: 'How would you rate your acne severity?',
    type: 'scale',
    min: 0,
    max: 10,
    label: 'Severity',
  },
  {
    id: 'weight_changes',
    question: 'Have you experienced unexplained weight gain in the past year?',
    type: 'choice',
    options: ['No weight gain', 'Mild gain (5-10 lbs)', 'Moderate gain (10-20 lbs)', 'Significant gain (>20 lbs)'],
  },
  {
    id: 'fatigue',
    question: 'How often do you feel unusually tired or fatigued?',
    type: 'choice',
    options: ['Rarely', 'Sometimes (1-2 times per week)', 'Often (3-5 times per week)', 'Daily'],
  },
  {
    id: 'mood_changes',
    question: 'Do you experience mood swings or anxiety?',
    type: 'choice',
    options: ['Rarely', 'Occasionally', 'Frequently', 'Very frequently'],
  },
  {
    id: 'sleep_quality',
    question: 'How would you rate your sleep quality?',
    type: 'scale',
    min: 0,
    max: 10,
    label: 'Quality',
  },
  {
    id: 'exercise',
    question: 'How many days per week do you exercise?',
    type: 'choice',
    options: ['0 days', '1-2 days', '3-4 days', '5+ days'],
  },
  {
    id: 'diet',
    question: 'How would you describe your diet?',
    type: 'choice',
    options: ['Mostly processed foods', 'Balanced with some processed foods', 'Mostly whole foods', 'Strict whole food diet'],
  },
  {
    id: 'stress',
    question: 'How would you rate your stress level?',
    type: 'scale',
    min: 0,
    max: 10,
    label: 'Stress',
  },
  {
    id: 'fertility',
    question: 'Are you experiencing difficulty conceiving (if applicable)?',
    type: 'choice',
    options: ['Not applicable', 'No difficulty', 'Some difficulty (<6 months)', 'Significant difficulty (>6 months)'],
  },
];

export default function Assessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isAnswered = answers[question.id] !== undefined;

  const pollReportStatus = async (reportId: string): Promise<void> => {
    setIsPolling(true);
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/reports/${reportId}/status`);
        const data = await response.json();
        
        if (data.status === 'complete') {
          setIsPolling(false);
          const submitResponse = await apiRequest('POST', '/api/assessments', { answers });
          await submitResponse.json();
          
          await queryClient.invalidateQueries({ queryKey: ['/api/risk-score'] });
          await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
          await queryClient.invalidateQueries({ queryKey: ['/api/insights'] });

          toast({
            title: "Assessment complete!",
            description: "Your personalized health insights are ready.",
          });

          setIsSubmitting(false);
          setLocation('/');
          return;
        } else if (data.status === 'failed') {
          throw new Error('Report analysis failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        setIsPolling(false);
        setIsSubmitting(false);
        toast({
          title: "Analysis failed",
          description: "Your report analysis failed. Please try uploading again.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsPolling(false);
    setIsSubmitting(false);
    toast({
      title: "Timeout",
      description: "Report analysis is taking longer than expected. Please try again later.",
      variant: "destructive",
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleChoiceSelect = (value: string) => {
    setAnswers({ ...answers, [question.id]: value });
  };

  const handleScaleChange = (value: number[]) => {
    setAnswers({ ...answers, [question.id]: value[0] });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest('POST', '/api/assessments', { answers });
      const data = await response.json();
      
      if (response.status === 202) {
        toast({
          title: "Analyzing your report",
          description: "Your medical report is being analyzed. This may take a minute...",
        });
        
        await pollReportStatus(data.reportId);
        return;
      }
      
      await queryClient.invalidateQueries({ queryKey: ['/api/risk-score'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/insights'] });

      toast({
        title: "Assessment complete!",
        description: "Your personalized health insights are ready.",
      });

      setLocation('/');
    } catch (error: any) {
      console.error('Assessment submission error:', error);
      
      let description = "There was an error submitting your assessment. Please try again.";
      if (error.message?.includes('No medical report')) {
        description = "Please upload a medical report first before taking the assessment.";
      } else if (error.message?.includes('analysis failed')) {
        description = "Your report analysis failed. Please try uploading your report again.";
      }
      
      toast({
        title: "Submission failed",
        description,
        variant: "destructive",
      });
    } finally {
      if (!isPolling) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-foreground mb-2" data-testid="text-assessment-title">Health Assessment</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Answer these questions to help us understand your health better
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" data-testid="progress-assessment" />
      </div>

      <Card data-testid="card-question">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">{question.question}</CardTitle>
          <CardDescription>
            {question.type === 'scale' && `Use the slider to rate from ${question.min} (lowest) to ${question.max} (highest)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {question.type === 'choice' && question.options ? (
            <RadioGroup
              value={answers[question.id]?.toString()}
              onValueChange={handleChoiceSelect}
              className="space-y-3"
              data-testid="radio-group-options"
            >
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-4 rounded-md border hover-elevate active-elevate-2 transition-colors"
                  data-testid={`radio-option-${index}`}
                >
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer text-base font-normal"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : question.type === 'scale' ? (
            <div className="space-y-6 py-4">
              <Slider
                value={[answers[question.id] as number || question.min || 0]}
                onValueChange={handleScaleChange}
                min={question.min || 0}
                max={question.max || 10}
                step={1}
                className="w-full"
                data-testid="slider-scale"
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{question.min || 0} - None</span>
                <span className="text-2xl font-bold text-primary">
                  {answers[question.id] !== undefined ? answers[question.id] : question.min || 0}
                </span>
                <span className="text-muted-foreground">{question.max || 10} - Severe</span>
              </div>
            </div>
          ) : null}

          <div className="flex justify-between gap-3 pt-4 flex-wrap">
            <Button
              onClick={handlePrevious}
              variant="outline"
              disabled={currentQuestion === 0}
              size="default"
              data-testid="button-previous"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentQuestion === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={!isAnswered || isSubmitting}
                size="default"
                data-testid="button-submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Complete Assessment'
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isAnswered}
                size="default"
                data-testid="button-next"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
