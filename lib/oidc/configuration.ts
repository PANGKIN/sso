import sanitizeHtml from 'sanitize-html';
import { Configuration } from 'oidc-provider';
import { jwk } from '../../keys';

if (!process.env.OIDC_SESSION_KEY) {
  process.exit(1);
}

const configuration: Configuration = {
  clients: [
    {
      client_id: 'foo',
      redirect_uris: ['https://jwt.io'], // using jwt.io as redirect_uri to show the ID Token contents
      response_types: ['id_token'],
      grant_types: ['implicit'],
      token_endpoint_auth_method: 'none',
    },
  ],
  interactions: {
    url(ctx, interaction) {
      // eslint-disable-line no-unused-vars
      return `/oidc/interaction/${interaction.uid}`;
    },
  },
  cookies: {
    keys: [process.env.OIDC_SESSION_KEY],
    short: {
      httpOnly: true,
      overwrite: true,
      sameSite: 'lax',
      signed: true,
      //secure: true,
    },
  },
  claims: {
    email: ['email', 'email_verified'],
    nickname: ['nickname'],
    role: ['role'],
  },
  features: {
    devInteractions: { enabled: false }, // defaults to true
    registration: {
      enabled: false,
    },
    deviceFlow: { enabled: true }, // defaults to false
    revocation: { enabled: true }, // defaults to false
  },
  renderError: async function renderError(ctx, out, error) {
    ctx.type = 'html';
    ctx.body = `<!DOCTYPE html>
      <head>
        <title>oops! something went wrong</title>
        <style>/* css and html classes omitted for brevity, see lib/helpers/defaults.js */</style>
      </head>
      <body>
        <div>
          <h1>오류가 발생했어요!</h1>
          ${Object.entries(out)
            .map(
              ([key, value]) =>
                `<pre><strong>${key}</strong>: ${sanitizeHtml(value)}</pre>`
            )
            .join('')}
        </div>
      </body>
      </html>`;
  },
  jwks: {
    keys: [jwk],
  },
  ttl: {
    AccessToken: function AccessTokenTTL(ctx, token, client) {
      const anyToken = token as any;
      if (anyToken.resourceServer) {
        return anyToken.resourceServer.accessTokenTTL || 60 * 60; // 1 hour in seconds
      }
      return 60 * 60; // 1 hour in seconds
    },
    AuthorizationCode: 600 /* 10 minutes in seconds */,
    BackchannelAuthenticationRequest:
      function BackchannelAuthenticationRequestTTL(ctx, request, client) {
        if (ctx && ctx.oidc && ctx.oidc.params.requested_expiry) {
          return Math.min(10 * 60, +ctx.oidc.params.requested_expiry); // 10 minutes in seconds or requested_expiry, whichever is shorter
        }

        return 10 * 60; // 10 minutes in seconds
      },
    ClientCredentials: function ClientCredentialsTTL(ctx, token, client) {
      const anyToken = token as any;
      if (anyToken.resourceServer) {
        return anyToken.resourceServer.accessTokenTTL || 10 * 60; // 10 minutes in seconds
      }
      return 10 * 60; // 10 minutes in seconds
    },
    DeviceCode: 600 /* 10 minutes in seconds */,
    Grant: 1209600 /* 14 days in seconds */,
    IdToken: 3600 /* 1 hour in seconds */,
    Interaction: 3600 /* 1 hour in seconds */,
    RefreshToken: function RefreshTokenTTL(ctx, token, client) {
      if (
        ctx &&
        ctx.oidc.entities.RotatedRefreshToken &&
        client.applicationType === 'web' &&
        client.tokenEndpointAuthMethod === 'none' &&
        !token.isSenderConstrained()
      ) {
        // Non-Sender Constrained SPA RefreshTokens do not have infinite expiration through rotation
        return ctx.oidc.entities.RotatedRefreshToken.remainingTTL;
      }

      return 14 * 24 * 60 * 60; // 14 days in seconds
    },
    Session: 86400 /* 1 days in seconds */,
  },
};

export default configuration;
