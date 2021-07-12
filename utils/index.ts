import jwt from 'jsonwebtoken';
import { privateCert, publicCert } from '../keys/index';

const { ISSUER } = process.env;

/**
 * Return a unique identifier with the given `len`.
 *
 * @param {Number} length
 * @return {String}
 * @api private
 */
export const getUid = (length) => {
  let uid = '';
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charsLength = chars.length;

  for (let i = 0; i < length; ++i) {
    uid += chars[getRandomInt(0, charsLength - 1)];
  }

  return uid;
};

/**
 * Return a random int, used by `utils.getUid()`.
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * jwt sign
 * @param {*} payload
 * @param {string} expiresIn
 */

export const jwt_sign = (payload, expiresIn) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { ...payload },
      privateCert,
      {
        algorithm: 'RS256',
        expiresIn,
        issuer: ISSUER,
      },
      (err, token) => {
        if (err) return reject(err);
        return resolve(token);
      }
    );
  });
};

interface ITokenData {
  token_type: string;
  accountId: string;
  clientId: string;
}

/**
 * jwt verify
 * @param {string} token
 */
export const jwt_verify = (token) => {
  return new Promise<ITokenData>((resolve, reject) => {
    jwt.verify(
      token,
      publicCert,
      { issuer: ISSUER, algorithms: ['RS256'] },
      (err, decoded) => {
        if (err) return reject(err);
        return resolve(decoded as ITokenData);
      }
    );
  });
};
