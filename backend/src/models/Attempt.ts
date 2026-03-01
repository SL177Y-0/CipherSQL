import mongoose from 'mongoose';

const AttemptSchema = new mongoose.Schema({
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    userId: { type: String, default: 'anonymous' },
    queryText: { type: String, required: true },
    status: { type: String, enum: ['success', 'error', 'timeout'], required: true },
    error: { type: String },
    executionTime: { type: Number },
    rowCount: { type: Number },
}, { timestamps: true });

AttemptSchema.index({ assignmentId: 1, createdAt: -1 });

export const Attempt = mongoose.model('Attempt', AttemptSchema);
