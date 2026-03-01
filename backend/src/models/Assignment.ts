import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'], required: true },
  description: { type: String, required: true },
  questionMarkdown: { type: String, required: true },
  schemaName: { type: String, required: true },
  tags: { type: [String], default: [] },
  number: { type: String, required: true, unique: true },
  estimatedTime: { type: String, default: '10 min' },
  attempts: { type: Number, default: 0 },
  completionPercentage: { type: Number, default: 0 },
  requirements: { type: [String], default: [] },
  expectedOutput: { type: String, default: '' },
}, { timestamps: true });

export const Assignment = mongoose.model('Assignment', AssignmentSchema);
