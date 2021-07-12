import fs from 'fs';
import path from 'path';
import { pem2jwk } from 'pem-jwk';
import NodeRSA from 'node-rsa';

const privateKeyFilePath = path.resolve(__dirname, './private_key.pem');

const publicKeyFilePath = path.resolve(__dirname, './public_key.pem');

let privateCert, publicCert;
try {
  privateCert = fs.readFileSync(privateKeyFilePath);
  publicCert = fs.readFileSync(publicKeyFilePath);
} catch (e) {
  const key = new NodeRSA();
  key.generateKeyPair();
  privateCert = key.exportKey('pkcs1-private-pem');
  publicCert = key.exportKey('pkcs8-public-pem');
  fs.writeFileSync(privateKeyFilePath, privateCert);
  fs.writeFileSync(publicKeyFilePath, publicCert);
}

export { privateCert, publicCert };
export const jwk = pem2jwk(privateCert.toString('ascii'));
