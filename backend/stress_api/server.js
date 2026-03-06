const express = require("express");
const axios = require("axios");
const cors = require("cors");
const connectDB = require('./config/database');
const Prediction = require('./models/Prediction');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Main prediction endpoint with MongoDB storage
app.post("/api/predict", async (req, res) => {
  try {
    const { studentId, ...inputData } = req.body;

    // Get prediction from ML service (Flask on port 5001)
    const mlResponse = await axios.post("http://127.0.0.1:5001/predict", inputData);

    // Check for early warning
    let earlyWarning = {
      isHighRisk: false,
      consecutiveHighRisk: 0,
      lastHighRiskDate: null
    };

    if (studentId && (mlResponse.data.stress_level === 'Bad' || mlResponse.data.stress_level === 'Awful')) {
      const recentPredictions = await Prediction.find({
        studentId,
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).sort({ timestamp: -1 }).limit(5);

      let consecutive = 1;
      for (const pred of recentPredictions) {
        if (pred.stressLevel === 'Bad' || pred.stressLevel === 'Awful') {
          consecutive++;
        } else {
          break;
        }
      }

      if (consecutive >= 2) {
        earlyWarning = {
          isHighRisk: true,
          consecutiveHighRisk: consecutive,
          lastHighRiskDate: new Date()
        };
      }
    }

    // Save prediction to MongoDB
    const prediction = new Prediction({
      studentId: studentId || null,
      inputData: inputData,
      stressLevel: mlResponse.data.stress_level,
      predictionCode: mlResponse.data.prediction_code,
      aiRecommendations: mlResponse.data.ai_recommendations || [],
      aiPowered: mlResponse.data.ai_powered || false,
      mainCauses: mlResponse.data.main_causes || [],
      earlyWarning: earlyWarning,
      timestamp: new Date()
    });

    await prediction.save();

    res.json({
      ...mlResponse.data,
      predictionId: prediction._id,
      earlyWarning: earlyWarning.isHighRisk ? {
        message: `EARLY WARNING: ${earlyWarning.consecutiveHighRisk} consecutive high-risk predictions detected`,
        consecutiveCount: earlyWarning.consecutiveHighRisk,
        recommendation: "Immediate counselor intervention recommended"
      } : null
    });

  } catch (err) {
    console.error('Prediction Error:', err.message);
    res.status(500).json({ error: "Prediction Service Error" });
  }
});

// Get prediction history for a student
app.get("/api/history/:studentId", async (req, res) => {
  try {
    const predictions = await Prediction.getStudentHistory(req.params.studentId, 20);
    res.json(predictions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all high-risk students
app.get("/api/analytics/high-risk-students", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const students = await Prediction.getHighRiskStudents(days);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get early warning students
app.get("/api/analytics/early-warnings", async (req, res) => {
  try {
    const students = await Prediction.getEarlyWarningStudents();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stress level trends
app.get("/api/analytics/trends", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const trends = await Prediction.aggregate([
      { $match: { timestamp: { $gte: dateThreshold } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          good: { $sum: { $cond: [{ $eq: ["$stressLevel", "Good"] }, 1, 0] } },
          bad: { $sum: { $cond: [{ $eq: ["$stressLevel", "Bad"] }, 1, 0] } },
          awful: { $sum: { $cond: [{ $eq: ["$stressLevel", "Awful"] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard statistics
app.get("/api/analytics/dashboard/stats", async (req, res) => {
  try {
    const totalPredictions = await Prediction.countDocuments();
    const highRiskCount = await Prediction.countDocuments({
      stressLevel: { $in: ['Bad', 'Awful'] }
    });
    const earlyWarningCount = await Prediction.countDocuments({
      'earlyWarning.isHighRisk': true
    });
    const recentPredictions = await Prediction.find().sort({ timestamp: -1 }).limit(10);

    res.json({
      totalPredictions,
      highRiskCount,
      earlyWarningCount,
      recentPredictions,
      highRiskPercentage: totalPredictions > 0
        ? ((highRiskCount / totalPredictions) * 100).toFixed(2)
        : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark intervention taken
app.patch("/api/predictions/:id/intervention", async (req, res) => {
  try {
    const { notes } = req.body;
    const prediction = await Prediction.findByIdAndUpdate(
      req.params.id,
      { interventionTaken: true, interventionNotes: notes || "Intervention recorded" },
      { new: true }
    );
    res.json(prediction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete prediction history
app.delete("/api/history/:studentId", async (req, res) => {
  try {
    const result = await Prediction.deleteMany({ studentId: req.params.studentId });
    res.json({ message: `Deleted ${result.deletedCount} predictions` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Stress API backend running on port ${PORT}`));
