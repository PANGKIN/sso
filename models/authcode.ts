import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAuthCode {
  authorizationCode: string;
  clientId: string;
  accountId: string;
  username: string;
  redirectUri: string;
  createdAt: Date;
}

interface IAuthCodeDocument extends IAuthCode, Document {}

interface IAuthCodeModel extends Model<IAuthCodeDocument> {
  findByCode: (authorizationCode: string) => Promise<IAuthCodeDocument>;
}

const AuthCodeSchema = new Schema<IAuthCodeDocument, IAuthCodeModel>({
  authorizationCode: String,
  clientId: String,
  accountId: String,
  username: String,
  redirectUri: String,
  createdAt: { type: Date, default: Date.now, index: { expires: 180 } },
});

AuthCodeSchema.statics.findByCode = function (authorizationCode) {
  return this.findOne({ authorizationCode }).exec();
};

const AuthCodeModel = mongoose.model<IAuthCodeDocument, IAuthCodeModel>(
  'oauth2_code',
  AuthCodeSchema
);

export default AuthCodeModel;
