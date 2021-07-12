import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { BasicStrategy } from 'passport-http';
import { Strategy as ClientPasswordStrategy } from 'passport-oauth2-client-password';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import bcrypt from 'bcrypt';

import { jwt_verify } from '../utils/index';
import UserAccountModel from '../models/userAccount';
import ClientModel from '../models/client';

/**
 * LocalStrategy
 *
 * This strategy is used to authenticate users based on a username and password.
 * Anytime a request is made to authorize an application, we must ensure that
 * a user is logged in before asking them to approve the request.
 */
passport.use(
  new LocalStrategy({ usernameField: 'id' }, async (id, password, done) => {
    const user = await UserAccountModel.findByAccountId(id);
    if (!user) {
      return done(null, false);
    }
    if (await bcrypt.compare(password, user.hashedPassword)) {
      return done(null, user);
    }
    return done(null, false);
  })
);

passport.serializeUser((user, done) => done(null, user.accountId));

passport.deserializeUser<string>((id, done) => {
  UserAccountModel.findByAccountId(id)
    .then((user) => done(null, user))
    .catch((err) => done(err));
});

/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients. They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens. The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate. Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header). While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
async function verifyClient(clientId, clientSecret, done) {
  const client = await ClientModel.findById(clientId).exec();
  if (!client) return done(null, false);
  if (await bcrypt.compare(clientSecret, client.clientSecret)) {
    return done(null, client);
  }
  return done(null, false);
}

passport.use(new BasicStrategy(verifyClient));

passport.use(new ClientPasswordStrategy(verifyClient));

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token). If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(
  new BearerStrategy(async (accessToken, done) => {
    try {
      const decoded = await jwt_verify(accessToken);
      if (decoded.accountId) {
        const user = await UserAccountModel.findByAccountId(decoded.accountId);
        if (!user) return done(null, false);
        done(null, user, { scope: '*' });
      } else {
        // The request came from a client only since userId is null,
        // therefore the client is passed back instead of a user.
        const client = await ClientModel.findById(decoded.clientId).exec();
        if (!client) return done(null, false);
        done(null, client, { scope: '*' });
      }
    } catch (e) {
      return done(null, false);
    }
  })
);
