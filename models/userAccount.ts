import mongoose, { Document, Model, Schema, ObjectId } from 'mongoose';

export interface IUserAccount {
  accountId: string;
  hashedPassword: string;
  email: string;
  email_verified: boolean;
  nickname: string;
  role: string;
  oauth2_approval: string[];
}

export interface IUserAccountDocument extends IUserAccount, Document {}

export interface IUserAccountModel extends Model<IUserAccountDocument> {
  findByAccountId: (accountId: string) => Promise<IUserAccountDocument>;
  findByNickname: (nickname: string) => Promise<IUserAccountDocument>;
  findAndApproval: (id: string, clientId: string) => Promise<boolean>;
}

const UserAccountSchema = new Schema<IUserAccountDocument, IUserAccountModel>({
  accountId: { type: String, index: { unique: true } },
  hashedPassword: String,
  email: String,
  email_verified: {
    type: Boolean,
    default: false,
  },
  nickname: { type: String, index: { unique: true } },
  role: { type: String, default: 'user' },
  oauth2_approval: { type: [String], default: [] },
});

UserAccountSchema.statics.findByAccountId = function (accountId: string) {
  return this.findOne({ accountId }).exec();
};

UserAccountSchema.statics.findByNickname = function (nickname: string) {
  return this.findOne({ nickname }).exec();
};

UserAccountSchema.statics.findAndApproval = async function (
  id: string,
  clientId: ObjectId
) {
  const user = await this.findByAccountId(id);
  if (user.oauth2_approval.find((v) => clientId.toString() === v)) return true;
  else return false;
};

const UserAccountModel = mongoose.model<
  IUserAccountDocument,
  IUserAccountModel
>('UserAccount', UserAccountSchema);

export default UserAccountModel;
