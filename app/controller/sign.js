'use strict';

const validator      = require('validator');
const Controller = require('egg').Controller;

const tools = require('../common/tools');

class SignController extends Controller {
  async showLogin() {
    const { ctx } = this;
    const options = {
      layout: 'layout.html',
    };
    await ctx.render('/sign/signin', {}, options);
  }

  //sign up
  async showSignup() {
    const { ctx } = this;
    const options = {
      layout: 'layout.html',
    };
    await ctx.render('/sign/signup', {}, options);
  };

  async signup() {
    const {ctx, service, config} = this;
    var loginname = validator.trim(ctx.request.body.loginname).toLowerCase();
    var email     = validator.trim(ctx.request.body.email).toLowerCase();
    var pass      = validator.trim(ctx.request.body.pass);
    var rePass    = validator.trim(ctx.request.body.re_pass);

    var msg;
    // 验证信息的正确性
    if ([loginname, pass, rePass, email].some((item) => {
      return item === '';
    })) {
      msg = '信息不完整。';
    } else if (loginname.length < 5) {
      msg = '用户名至少需要5个字符。';
    } else if (!tools.validateId(loginname)) {
      msg = '用户名不合法。';
    } else if (!validator.isEmail(email)) {
      msg = '邮箱不合法。';
    } else if (pass !== rePass) {
      msg = '两次密码输入不一致。';
    }
    // END 验证信息的正确性

    if (msg) {
      ctx.status = 422;
      await ctx.render('sign/signup', {
        error: msg,
        loginname: loginname,
        email: email
      });
      return;
    }

    const users = await service.user.getUsersByQuery({'$or': [
      {'loginname': loginname},
      {'email': email}
    ]}, {});

    if (users.length > 0) {
      ctx.status = 422;
      await ctx.render('sign/signup', {
        error: '用户名或邮箱已被使用。',
        loginname: loginname,
        email: email
      });
      return;
    }

    const passhash = tools.bhash(pass);

    // create gravatar
    var avatarUrl = service.user.makeGravatar(email);

    await service.user.newAndSave(loginname, loginname, passhash, email, avatarUrl, false);
    // 发送激活邮件
    // await mail.sendActiveMail(email, utility.md5(email + passhash + config.session_secret), loginname);
    const options = {
      layout: 'layout.html',
    };
    await ctx.render('sign/signup', {
      success: '欢迎加入 ' + config.name + '！我们已给您的注册邮箱发送了一封邮件，请点击里面的链接来激活您的帐号。'
    }, options);
  }

  async signout() {
    const { ctx } = this;
    ctx.session = null;
    ctx.logout();
    ctx.redirect('/');
  }
}

module.exports = SignController;
