import mongoose from "mongoose";
const { Schema } = mongoose;

const DepartmentSchema = new Schema(
  {
    id: {
      type: String,
    },
    short_name: {
      type: String,
    },
    name: {
      type: String,
    },
  },
  { versionKey: false }
);

export interface Department extends mongoose.Document {
  id: string;
  short_name: string;
  name: string;
}

DepartmentSchema.set("toObject", { virtuals: true });

const DepartmentModel = mongoose.model<Department>("Department", DepartmentSchema);
export default DepartmentModel;
