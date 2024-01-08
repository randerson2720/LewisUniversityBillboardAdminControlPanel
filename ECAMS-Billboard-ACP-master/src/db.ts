import mongoose, { ConnectOptions } from "mongoose";

mongoose.Promise = global.Promise;
const connect = async () => {
  await mongoose
    .connect(process.env.MONGO_URI!, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions)
    .then(() => {
      console.log("Connected to API Database - Initial Connection");
    })
    .catch((err) => {
      console.log(
        `Initial Distribution API Database connection error occured -`,
        err
      );
    });
};
export default { connect };
