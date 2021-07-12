import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IClient {
  name: string;
  clientSecret: string;
  redirectUris: string[];
  grants: string[];
  isTrusted: boolean;
}

interface IClientDocument extends IClient, Document {}

interface IClientModel extends Model<IClientDocument> {}

const ClientSchema = new Schema<IClientDocument, IClientModel>({
  name: String,
  clientSecret: String,
  redirectUris: [String],
  grants: [String],
  isTrusted: { type: Boolean, default: false },
});

const ClientModel = mongoose.model<IClientDocument, IClientModel>(
  'oauth2_client',
  ClientSchema
);

export default ClientModel;
