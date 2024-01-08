import mongoose from "mongoose";
const { Schema } = mongoose;
const UserSchema = new Schema(
  {
    id: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
  },
  { versionKey: false }
);
const User = mongoose.model("User", UserSchema);
export default User;
