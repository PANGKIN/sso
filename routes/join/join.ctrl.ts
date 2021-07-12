import UserAccount from '../../models/userAccount';
import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from 'express';
import UserAccountModel from '../../models/userAccount';

export const joinForm = (req: Request, res: Response, next: NextFunction) => {
  const { redirectTo, message } = req.query;
  if (redirectTo) req.session.joinRedirectTo = redirectTo as string;
  res.render('join', {
    message,
    title: '회원가입',
  });
};

export const join = async (req: Request, res: Response, next: NextFunction) => {
  const { id, password, nickname, email } = req.body;
  if (!id || !password || !nickname || !email) {
    return res.redirect('/join?message=에러');
  }
  if (
    id.length < 5 ||
    !/^[a-zA-Z0-9]+$/.test(id) ||
    nickname < 2 ||
    !/^[가-힣a-zA-Z0-9]+$/.test(id) ||
    password < 8 ||
    !/^[a-zA-Z0-9\(#?!@$%^&*\-\)]+$/.test(password) ||
    !/^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i.test(
      email
    )
  )
    return res.redirect('/join?message=에러');
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await new UserAccount({
      nickname,
      hashedPassword,
      accountId: id,
      email,
    }).save();
    return res.redirect(
      req.session.joinRedirectTo ? req.session.joinRedirectTo : '/'
    );
  } catch (e) {
    return res.redirect('/join?message=이미 존재하는 아이디입니다.'); //아이디 중복
  }
};

export const confirm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { type } = req.params;
  const { value } = req.body;
  let result;
  switch (type) {
    case 'id':
      result = await UserAccountModel.findByAccountId(value);
      if (result)
        return res.json({
          success: false,
          message: '중복된 아이디입니다.',
        });
      break;
    case 'nickname':
      result = await UserAccountModel.findByNickname(value);
      if (result)
        return res.json({
          success: false,
          message: '중복된 닉네임입니다.',
        });
      break;
    default:
      return res.json({
        success: false,
      });
  }
  return res.json({ success: true });
};
