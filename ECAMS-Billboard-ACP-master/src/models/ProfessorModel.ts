import mongoose from "mongoose";
const { Schema } = mongoose;

const ProfessorSchema = new Schema(
  {
    id: {
      type: String,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    hours: {
      type: String,
    },
    room: {
      type: String,
    },
    phone: {
      type: String,
    },
    website: {
      type: String,
    },
    department: {
      type: String,
    }
  },
  { versionKey: false }
);

export interface Professor extends mongoose.Document {
  id: string;
  name: string;
  email: string;
  hours: string;
  room: string;
  phone: string;
  website: string;
  department: string;
}

ProfessorSchema.set("toObject", { virtuals: true });

const ProfessorModel = mongoose.model<Professor>("Professor", ProfessorSchema);
export default ProfessorModel;
