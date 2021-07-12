import { nanoid } from 'nanoid';
import UserAccountModel, { IUserAccount } from '../../models/userAccount';

class Account {
  [key: string]: any;
  accountId: string;
  constructor(private userAccount: IUserAccount) {
    this.accountId = this.userAccount.accountId || nanoid();
  }

  /**
   * @param use - can either be "id_token" or "userinfo", depending on
   *   where the specific claims are intended to be put in.
   * @param scope - the intended scope, while oidc-provider will mask
   *   claims depending on the scope automatically you might want to skip
   *   loading some claims from external resources etc. based on this detail
   *   or not return them in id tokens but only userinfo and so on.
   */
  async claims(use, scope) {
    // eslint-disable-line no-unused-vars

    return {
      sub: this.accountId,

      email: this.userAccount.email,
      email_verified: this.userAccount.email_verified,
      nickname: this.userAccount.nickname,
      role: this.userAccount.role,
    };
  }

  static async findAccount(ctx, id, token) {
    const account = await UserAccountModel.findByAccountId(id);
    if (!account) return undefined;
    return new Account(account);
  }
}

export default Account;
