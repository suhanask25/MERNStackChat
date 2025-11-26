import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { analyzeMedicalReport, calculateRiskScore, generateDailyTasks, generateInsights, generateChatResponse } from "./gemini";

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post('/api/reports/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'AI service not configured. Please add GEMINI_API_KEY.' });
      }

      const report = await storage.createMedicalReport({
        fileName: req.file.originalname,
        fileUrl: `/uploads/${path.basename(req.file.path)}`,
        fileType: req.file.mimetype,
        analysisComplete: 0,
        extractedData: null,
      });

      setTimeout(async () => {
        try {
          const analysisResult = await analyzeMedicalReport(req.file!.path, req.file!.mimetype);
          
          await storage.updateMedicalReport(report.id, {
            extractedData: analysisResult,
            analysisComplete: 1,
          });

          if (analysisResult.parameters && Array.isArray(analysisResult.parameters)) {
            for (const param of analysisResult.parameters) {
              await storage.createMedicalParameter({
                reportId: report.id,
                parameterName: param.name || 'Unknown',
                value: param.value?.toString() || '0',
                unit: param.unit || null,
                referenceRange: param.referenceRange || null,
                status: param.status || null,
              });
            }
          }
        } catch (error) {
          console.error('Background analysis error:', error);
          await storage.updateMedicalReport(report.id, {
            analysisComplete: -1,
          });
        }
      }, 100);

      res.json(report);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  app.post('/api/assessments', async (req, res) => {
    try {
      const { answers } = req.body;
      if (!answers || typeof answers !== 'object') {
        return res.status(400).json({ error: 'Valid answers object is required' });
      }

      const reports = await storage.getAllMedicalReports();
      const latestReport = reports[0];

      if (!latestReport) {
        return res.status(400).json({ 
          error: 'No medical report found. Please upload a report first.',
          status: 'no_report'
        });
      }

      if (latestReport.analysisComplete === 0) {
        return res.status(202).json({ 
          message: 'Report analysis is still in progress. Please wait.',
          status: 'processing',
          reportId: latestReport.id
        });
      }

      if (latestReport.analysisComplete === -1) {
        return res.status(500).json({ 
          error: 'Report analysis failed. Please try uploading again.',
          status: 'failed',
          reportId: latestReport.id
        });
      }

      const assessment = await storage.createAssessment({
        reportId: latestReport.id,
        answers,
      });

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'AI service not configured. Please contact support.' });
      }

      try {
        const riskResult = await calculateRiskScore(latestReport.extractedData, answers);
        
        await storage.createRiskScore({
          reportId: latestReport.id,
          assessmentId: assessment.id,
          score: riskResult.score,
          riskLevel: riskResult.riskLevel,
          interpretation: riskResult.interpretation,
        });

        const tasks = await generateDailyTasks(latestReport.extractedData, riskResult);
        for (const task of tasks) {
          await storage.createDailyTask({
            reportId: latestReport.id,
            taskType: task.taskType,
            description: task.description,
            target: task.target || null,
            completed: 0,
          });
        }

        const insights = await generateInsights(latestReport.extractedData, answers);
        for (const insight of insights) {
          await storage.createInsight({
            reportId: latestReport.id,
            category: insight.category,
            title: insight.title,
            content: insight.content,
            severity: insight.severity || null,
          });
        }

        res.json({ ...assessment, status: 'complete' });
      } catch (aiError) {
        console.error('AI processing error:', aiError);
        return res.status(500).json({ error: 'Failed to process assessment with AI. Please try again later.' });
      }
    } catch (error) {
      console.error('Assessment error:', error);
      res.status(500).json({ error: 'Failed to save assessment' });
    }
  });

  app.get('/api/risk-score', async (req, res) => {
    try {
      const riskScore = await storage.getLatestRiskScore();
      res.json(riskScore || null);
    } catch (error) {
      console.error('Risk score error:', error);
      res.status(500).json({ error: 'Failed to fetch risk score' });
    }
  });

  app.get('/api/tasks', async (req, res) => {
    try {
      const tasks = await storage.getDailyTasks();
      res.json(tasks);
    } catch (error) {
      console.error('Tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.patch('/api/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { completed } = req.body;
      
      const task = await storage.updateDailyTask(id, completed);
      res.json(task);
    } catch (error) {
      console.error('Task update error:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  app.get('/api/reports', async (req, res) => {
    try {
      const reports = await storage.getAllMedicalReports();
      res.json(reports);
    } catch (error) {
      console.error('Reports error:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });

  app.get('/api/parameters/latest', async (req, res) => {
    try {
      const parameters = await storage.getLatestMedicalParameters();
      res.json(parameters);
    } catch (error) {
      console.error('Parameters error:', error);
      res.status(500).json({ error: 'Failed to fetch parameters' });
    }
  });

  app.get('/api/parameters/all', async (req, res) => {
    try {
      const parameters = await storage.getAllMedicalParameters();
      res.json(parameters);
    } catch (error) {
      console.error('Parameters error:', error);
      res.status(500).json({ error: 'Failed to fetch all parameters' });
    }
  });

  app.get('/api/parameters/:reportId', async (req, res) => {
    try {
      const { reportId } = req.params;
      const parameters = await storage.getMedicalParametersByReportId(reportId);
      res.json(parameters);
    } catch (error) {
      console.error('Parameters error:', error);
      res.status(500).json({ error: 'Failed to fetch parameters' });
    }
  });

  app.get('/api/insights', async (req, res) => {
    try {
      const insights = await storage.getInsightsByReportId();
      res.json(insights);
    } catch (error) {
      console.error('Insights error:', error);
      res.status(500).json({ error: 'Failed to fetch insights' });
    }
  });

  app.get('/api/reports/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const reports = await storage.getAllMedicalReports();
      const report = reports.find(r => r.id === id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      let status = 'processing';
      if (report.analysisComplete === 1) status = 'complete';
      if (report.analysisComplete === -1) status = 'failed';

      res.json({ 
        reportId: report.id,
        status,
        analysisComplete: report.analysisComplete,
        fileName: report.fileName
      });
    } catch (error) {
      console.error('Report status error:', error);
      res.status(500).json({ error: 'Failed to fetch report status' });
    }
  });

  app.get('/api/emergency-contacts', async (req, res) => {
    try {
      const contacts = await storage.getEmergencyContacts();
      res.json(contacts);
    } catch (error) {
      console.error('Emergency contacts error:', error);
      res.status(500).json({ error: 'Failed to fetch emergency contacts' });
    }
  });

  app.post('/api/emergency-contacts', async (req, res) => {
    try {
      const { name, phone, relationship, isPrimary } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone are required' });
      }

      const contact = await storage.createEmergencyContact({
        name,
        phone,
        relationship: relationship || null,
        isPrimary: isPrimary ? 1 : 0,
      });
      res.json(contact);
    } catch (error) {
      console.error('Create emergency contact error:', error);
      res.status(500).json({ error: 'Failed to create emergency contact' });
    }
  });

  app.delete('/api/emergency-contacts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmergencyContact(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete emergency contact error:', error);
      res.status(500).json({ error: 'Failed to delete emergency contact' });
    }
  });

  app.get('/api/sos-alerts', async (req, res) => {
    try {
      const alerts = await storage.getSosAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('SOS alerts error:', error);
      res.status(500).json({ error: 'Failed to fetch SOS alerts' });
    }
  });

  app.post('/api/sos-trigger', async (req, res) => {
    try {
      const { location, severity } = req.body;
      const alert = await storage.createSosAlert({
        location: location || 'Unknown location',
        severity: severity || 'high',
        status: 'pending',
      });
      
      const contacts = await storage.getEmergencyContacts();
      console.log(`SOS Alert triggered. Notifying ${contacts.length} emergency contacts`);

      res.json({ alert, contactsNotified: contacts.length });
    } catch (error) {
      console.error('SOS trigger error:', error);
      res.status(500).json({ error: 'Failed to trigger SOS' });
    }
  });

  app.get('/api/chat/messages', async (req, res) => {
    try {
      const messages = await storage.getChatMessages();
      res.json(messages);
    } catch (error) {
      console.error('Chat messages error:', error);
      res.status(500).json({ error: 'Failed to fetch chat messages' });
    }
  });

  app.post('/api/chat/send', async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'AI service not configured. Please contact support.' });
      }

      await storage.createChatMessage({
        role: 'user',
        content,
      });

      try {
        const chatMessages = await storage.getChatMessages();
        const conversationHistory = chatMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const aiResponse = await generateChatResponse(content, conversationHistory);
        
        await storage.createChatMessage({
          role: 'assistant',
          content: aiResponse,
        });

        res.json({ success: true, response: aiResponse });
      } catch (aiError) {
        console.error('AI generation error:', aiError);
        const fallbackResponse = "I'm here to help with your health concerns. I encountered a temporary issue, but I'm ready to assist. Could you please rephrase your question or let me know what health topic you'd like to discuss?";
        
        await storage.createChatMessage({
          role: 'assistant',
          content: fallbackResponse,
        });

        res.json({ success: true, response: fallbackResponse });
      }
    } catch (error) {
      console.error('Chat send error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Period Cycle endpoints
  app.post('/api/period-cycles', async (req, res) => {
    try {
      const { startDate, endDate, flowIntensity, symptoms, notes } = req.body;
      const cycle = await storage.createPeriodCycle({
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        flowIntensity: flowIntensity || null,
        symptoms: symptoms || null,
        notes: notes || null,
      });
      res.json(cycle);
    } catch (error) {
      console.error('Create period cycle error:', error);
      res.status(500).json({ error: 'Failed to create period cycle' });
    }
  });

  app.get('/api/period-cycles', async (req, res) => {
    try {
      const cycles = await storage.getPeriodCycles();
      res.json(cycles);
    } catch (error) {
      console.error('Get period cycles error:', error);
      res.status(500).json({ error: 'Failed to fetch period cycles' });
    }
  });

  // Water Intake endpoints
  app.post('/api/water-intake', async (req, res) => {
    try {
      const { date, amountMl, time, notes } = req.body;
      if (!amountMl) {
        return res.status(400).json({ error: 'Amount is required' });
      }
      const intake = await storage.createWaterIntake({
        date: new Date(date || new Date()),
        amountMl,
        time: time || null,
        notes: notes || null,
      });
      res.json(intake);
    } catch (error) {
      console.error('Create water intake error:', error);
      res.status(500).json({ error: 'Failed to log water intake' });
    }
  });

  app.get('/api/water-intake', async (req, res) => {
    try {
      const intakes = await storage.getWaterIntake();
      res.json(intakes);
    } catch (error) {
      console.error('Get water intake error:', error);
      res.status(500).json({ error: 'Failed to fetch water intake' });
    }
  });

  app.get('/api/water-intake/today-total', async (req, res) => {
    try {
      const total = await storage.getWaterIntakeTodayTotal();
      res.json({ total });
    } catch (error) {
      console.error('Get water intake total error:', error);
      res.status(500).json({ error: 'Failed to fetch today total' });
    }
  });

  // Steps Tracker endpoints
  app.post('/api/steps-tracker', async (req, res) => {
    try {
      const { date, steps, distance, caloriesBurned, duration, notes } = req.body;
      if (!steps) {
        return res.status(400).json({ error: 'Steps is required' });
      }
      const tracker = await storage.createStepsTracker({
        date: new Date(date || new Date()),
        steps,
        distance: distance ? parseFloat(distance) : undefined,
        caloriesBurned: caloriesBurned ? parseFloat(caloriesBurned) : undefined,
        duration: duration || null,
        notes: notes || null,
      });
      res.json(tracker);
    } catch (error) {
      console.error('Create steps tracker error:', error);
      res.status(500).json({ error: 'Failed to log steps' });
    }
  });

  app.get('/api/steps-tracker', async (req, res) => {
    try {
      const tracker = await storage.getStepsTracker();
      res.json(tracker);
    } catch (error) {
      console.error('Get steps tracker error:', error);
      res.status(500).json({ error: 'Failed to fetch steps tracker' });
    }
  });

  app.get('/api/steps-tracker/today-total', async (req, res) => {
    try {
      const total = await storage.getStepsTodayTotal();
      res.json({ total });
    } catch (error) {
      console.error('Get steps total error:', error);
      res.status(500).json({ error: 'Failed to fetch today total' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
