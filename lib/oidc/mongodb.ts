/* eslint-disable max-classes-per-file */

// npm i mongodb@^3.0.0
//import { MongoClient, Db } from 'mongodb';
import mongoose from 'mongoose';
import snakeCase from 'lodash/snakeCase';
import { Adapter, AdapterPayload } from 'oidc-provider';
import { Collection, Db } from 'mongodb';

const grantable = new Set([
  'access_token',
  'authorization_code',
  'refresh_token',
  'device_code',
]);

const createIndex = (collection: Collection<any>) => {
  collection
    .createIndex([
      {
        key: { expiresAt: 1 },
        expireAfterSeconds: 0,
      },
    ])
    .catch(console.error);
};

class MongoAdapter implements Adapter {
  constructor(private name: string) {
    this.name = snakeCase(`oidc_${name}`);
  }

  // NOTE: the payload for Session model may contain client_id as keys, make sure you do not use
  //   dots (".") in your client_id value charset.

  async upsert(_id: string, payload: AdapterPayload, expiresIn: number) {
    let expiresAt;

    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    await this.coll().updateOne(
      { _id },
      { $set: { payload, ...(expiresAt ? { expiresAt } : undefined) } },
      { upsert: true }
    );
  }

  async find(_id: string) {
    const result = await this.coll().findOne({ _id });

    if (!result) return undefined;
    return result.payload;
  }
  async findByUserCode(userCode: string) {
    const result = await this.coll().findOne({ 'payload.userCode': userCode });

    if (!result) return undefined;
    return result.payload;
  }

  async findByUid(uid: string) {
    const result = await this.coll().findOne({ 'payload.uid': uid });

    if (!result) return undefined;
    return result.payload;
  }

  async destroy(_id: string) {
    await this.coll().deleteOne({ _id });
  }

  async revokeByGrantId(grantId: string) {
    await this.coll().deleteMany({ 'payload.grantId': grantId });
  }

  async consume(_id: string) {
    await this.coll().findOneAndUpdate(
      { _id },
      { $set: { 'payload.consumed': Math.floor(Date.now() / 1000) } }
    );
  }

  coll(name?: string) {
    return MongoAdapter.coll(name || this.name);
  }

  static coll(name: string) {
    const collection = mongoose.connection.db.collection(name);
    mongoose.connection.db.collections().then((value) => {
      const result = value.find((v) => v.collectionName === name);
      if (result) {
        result.indexes().then((value) => {
          const exist = value.find((v) => (v.key.expiresAt ? true : false));
          if (!exist) {
            createIndex(result);
          }
        });
      }
    });

    return collection;
  }
}

export default MongoAdapter;
