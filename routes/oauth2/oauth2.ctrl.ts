import oauth2orize from 'oauth2orize';

import AuthCode from '../../models/authcode';
import Client from '../../models/client';
import UserAccount from '../../models/userAccount';
import bcrypt from 'bcrypt';
import { jwt_sign, getUid, jwt_verify } from '../../utils/index';

// Create OAuth 2.0 server
const server = oauth2orize.createServer();

server.serializeClient((client, done) => done(null, client._id));

server.deserializeClient(async (id, done) => {
  const client = await Client.findById(id).exec();
  if (!client) return done(null, false);
  return done(null, client);
});

const generateAccessToken = (accountId, clientId) => {
  return jwt_sign(
    {
      token_type: 'access_token',
      accountId,
      clientId,
    },
    '30m'
  );
};

const generateRefreshToken = (accountId, clientId) => {
  return jwt_sign(
    {
      token_type: 'refresh_token',
      accountId,
      clientId,
    },
    '336h'
  );
};

async function issueTokens(accountId, clientId, done) {
  const user = await UserAccount.findByAccountId(accountId);
  try {
    const accessToken = await generateAccessToken(accountId, clientId);
    const refreshToken = await generateRefreshToken(accountId, clientId);
    const params = { accountId: user.accountId };
    return done(null, accessToken, refreshToken, params);
  } catch (e) {
    return done(e);
  }
}

server.grant(
  oauth2orize.grant.code(async (client, redirectUri, user, ares, done) => {
    const authorizationCode = getUid(32);
    new AuthCode({
      authorizationCode,
      clientId: client._id,
      accountId: user.accountId,
      nickname: user.nickname,
      redirectUri,
    })
      .save()
      .then((code) => done(null, authorizationCode))
      .catch((err) => done(err));
  })
);

server.grant(
  oauth2orize.grant.token((client, user, ares, done) => {
    issueTokens(user.accountId, client._id, done);
  })
);

server.exchange(
  oauth2orize.exchange.code(async (client, code, redirectUri, done) => {
    const codeDoc = await AuthCode.findByCode(code);
    if (!codeDoc) return done(new Error('Code Not Found'));
    if (!client._id.equals(codeDoc.clientId)) {
      return done(null, false);
    }
    if (redirectUri !== codeDoc.redirectUri) {
      return done(null, false);
    }
    issueTokens(codeDoc.accountId, client._id, done);
    await codeDoc.deleteOne();
  })
);
server.exchange(
  oauth2orize.exchange.password(async (client, id, password, scope, done) => {
    // Validate the client
    const clientDoc = await Client.findById(client._id).exec();
    if (!clientDoc) return done(null, false);
    if (clientDoc.clientSecret !== client.clientSecret)
      return done(null, false);
    const user = await UserAccount.findByAccountId(id);
    if (!user) return done(null, false);
    if (!(await bcrypt.compare(password, user.hashedPassword))) {
      return done(null, false);
    }
    issueTokens(user.accountId, client._id, done);
  })
);

server.exchange(
  oauth2orize.exchange.clientCredentials(async (client, scope, done) => {
    // Validate the client
    const clientDoc = await Client.findById(client._id).exec();
    if (!clientDoc) return done(null, false);
    if (clientDoc.clientSecret !== client.clientSecret)
      return done(null, false);
    issueTokens(null, client._id, done);
  })
);

// issue new tokens and remove the old ones
server.exchange(
  oauth2orize.exchange.refreshToken(
    async (client, refreshToken, scope, done) => {
      try {
        const decoded = await jwt_verify(refreshToken);
        if (!client._id.equals(decoded.clientId)) return done(null, false);
        issueTokens(decoded.accountId, decoded.clientId, done);
      } catch (e) {
        return done(e);
      }
    }
  )
);

export const loginForm = (req, res) => {
  const { message } = req.query;
  res.render('login', {
    accionUrl: `/oauth2/login`,
    title: '로그인',
    message,
    redirectTo: '/oauth2/login',
  });
};

export const account = (req, res) => {
  res.render('account', { user: req.user });
};

export const authorizeation = [
  server.authorization(
    async (clientId, redirectUri, done) => {
      try {
        const client = await Client.findById(clientId);
        return done(null, client, redirectUri);
      } catch (err) {
        return done(err);
      }
    },
    async (client, user, scope, type, area, done) => {
      if (client.isTrusted) return done(null, true, null, null);
      try {
        const result = await UserAccount.findAndApproval(
          user.accountId,
          client._id
        );
        done(null, result, null, null);
      } catch (err) {
        done(err, null, null, null);
      }
    }
  ),
  (req, res) => {
    res.render('dialog', {
      title: '권한 승인',
      transactionId: req.oauth2.transactionID,
      nickname: req.user.nickname,
      clientName: req.oauth2.client.name,
    });
  },
];

export const decision = server.decision(async (req: any, done) => {
  if (!req.body.cancel) {
    const user = await UserAccount.findByAccountId(req.user.accountId);
    if (
      user &&
      !user.oauth2_approval.includes(req.oauth2.client._id.toString())
    ) {
      user.oauth2_approval.push(req.oauth2.client._id);
      await user.save();
    }
  }
  done(null, null);
});

export const token = [server.token(), server.errorHandler()];

export const logout = (req, res) => {
  const { redirectUri } = req.query;
  req.logout();
  res.redirect(redirectUri);
};

export const setDefault = async (req, res) => {
  const secret = getUid(16);
  const client = new Client({
    clientSecret: await bcrypt.hash(secret, 10),
    redirectUris: ['https://www.pangkin.com'],
    grants: ['authorization_code', 'refresh_token'],
    name: 'pangkin',
  });

  const response = await client.save();
  res.json({ secret, id: response._id });
};

export const userInfo = async (req, res) => {
  res.json({
    accountId: req.user.accountId,
    nickname: req.user.nickname,
    role: req.user.role,
    email: req.user.email,
    scope: req.authInfo.scope,
  });
};
