import mongoose from "mongoose";
const { Schema } = mongoose;

const BannerSchema = new Schema(
  {
    id: {
      type: String,
    },
    name: {
      type: String,
    },
    image_name: {
      type: String,
    },
  },
  { versionKey: false }
);

export interface Banner extends mongoose.Document {
  id: string;
  name: string;
  image_name: string;
}

BannerSchema.set("toObject", { virtuals: true });

const BannerModel = mongoose.model<Banner>("Banner", BannerSchema);
export default BannerModel;
