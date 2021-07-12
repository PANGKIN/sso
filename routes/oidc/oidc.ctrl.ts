import querystring from 'querystring';
import { inspect } from 'util';
import isEmpty from 'lodash/isEmpty';
import { urlencoded } from 'express';
import passport from 'passport';
import { strict as assert } from 'assert';

import UserAccountModel from '../../models/userAccount';

const body = urlencoded({ extended: false });

const translationScope = {
  email: '이메일',
  nickname: '닉네임',
};

function setNoCache(req, res, next) {
  res.set('Pragma', 'no-cache');
  res.set('Cache-Control', 'no-cache, no-store');
  next();
}

export const interaction = [
  setNoCache,
  async (req, res, next) => {
    try {
      const { uid, prompt, params, session } =
        await req.provider.interactionDetails(req, res);
      const { message } = req.query;
      const client = await req.provider.Client.find(params.client_id as string);

      switch (prompt.name) {
        case 'login': {
          if (req.isAuthenticated && req.isAuthenticated()) {
            const result = {
              login: {
                accountId: req.user.accountId,
              },
            };
            return await req.provider.interactionFinished(req, res, result, {
              mergeWithLastSubmission: false,
            });
          }
          return res.render('login', {
            accionUrl: `/oidc/interaction/${uid}/login`,
            title: '로그인',
            message,
            redirectTo: `/oidc/interaction/${uid}`,
          });
        }
        case 'consent': {
          const { nickname } = await UserAccountModel.findByAccountId(
            session.accountId
          );
          return res.render('interaction', {
            clientName: client.clientName,
            uid,
            details: prompt.details,
            params,
            title: '권한 승인',
            nickname,
            translationScope,
          });
        }
        default:
          return undefined;
      }
    } catch (err) {
      return next(err);
    }
  },
];

export const login = [
  setNoCache,
  body,
  async (req, res, next) => {
    try {
      passport.authenticate('local', async (err, user, info) => {
        const { uid } = req.params;
        if (err) return next(err);
        if (!user) {
          return res.redirect(
            `/oidc/interaction/${uid}?message=아이디와 비밀번호가 일치하지 않습니다.`
          );
        }
        req.logIn(user, async (err) => {
          if (err) return next(err);
          const {
            prompt: { name },
          } = await req.provider.interactionDetails(req, res);
          assert.equal(name, 'login');
          const result = {
            login: {
              accountId: user.accountId,
            },
          };

          await req.provider.interactionFinished(req, res, result, {
            mergeWithLastSubmission: false,
          });
        });
      })(req, res, next);
    } catch (err) {
      next(err);
    }
  },
];

export const confirm = [
  setNoCache,
  body,
  async (req, res, next) => {
    try {
      const interactionDetails = await req.provider.interactionDetails(
        req,
        res
      );
      const {
        prompt: { name },
        params,
        session: { accountId },
      } = interactionDetails;
      const details: any = interactionDetails.prompt.details;
      assert.equal(name, 'consent');

      let { grantId } = interactionDetails;
      let grant;

      if (grantId) {
        // we'll be modifying existing grant in existing session
        grant = await req.provider.Grant.find(grantId);
      } else {
        // we're establishing a new grant
        grant = new req.provider.Grant({
          accountId,
          clientId: params.client_id as string,
        });
      }

      if (details.missingOIDCScope) {
        grant.addOIDCScope(details.missingOIDCScope.join(' '));
      }
      if (details.missingOIDCClaims) {
        grant.addOIDCClaims(details.missingOIDCClaims);
      }
      if (details.missingResourceScopes) {
        // eslint-disable-next-line no-restricted-syntax
        for (const [indicator, scopes] of Object.entries<any>(
          details.missingResourceScopes
        )) {
          grant.addResourceScope(indicator, scopes.join(' '));
        }
      }

      grantId = await grant.save();

      const consent: any = {};
      if (!interactionDetails.grantId) {
        // we don't have to pass grantId to consent, we're just modifying existing one
        consent.grantId = grantId;
      }

      const result = { consent };
      await req.provider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: true,
      });
    } catch (err) {
      next(err);
    }
  },
];

export const abort = [
  setNoCache,
  async (req, res, next) => {
    try {
      const result = {
        error: 'access_denied',
        error_description: 'End-User aborted interaction',
      };
      await req.provider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false,
      });
    } catch (err) {
      next(err);
    }
  },
];
