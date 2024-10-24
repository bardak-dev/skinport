import {HttpException, HttpStatus, Inject, Injectable, Scope, UnauthorizedException} from '@nestjs/common';
import {REQUEST} from '@nestjs/core';
import bcrypt from 'bcrypt';
import {InjectModel} from 'nestjs-typegoose';
import type {ReturnModelType} from '@typegoose/typegoose';
import {InjectRedisClient} from 'nestjs-ioredis-tags';
import {Redis} from 'ioredis';
import md5 from 'md5';
import {isEmail} from 'class-validator';
import {randomStringGenerator} from '@nestjs/common/utils/random-string-generator.util.js';
import type {ClientSession} from 'mongoose';
import {UserEntity, UserEntityDefaultSelect} from 'app/entities/User/index.js';
import {AuthRecoverDto, AuthSignInDto, AuthSignUpDto} from 'app/dto/Auth.js';
import {withTransaction} from 'app/utils/index.js';
import {BCRYPT_SALT_ROUNDS} from 'app/constants.js';
import {HttpStatusMessages} from 'app/messages/http.js';

@Injectable({scope: Scope.REQUEST})
export class AuthService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    @InjectModel(UserEntity) private readonly repoUser: ReturnModelType<typeof UserEntity>,
    @InjectRedisClient('skinport.com') private readonly redisClient: Redis
  ) {
  }

  async signOut(): Promise<boolean> {
    try {
      return await new Promise((resolve, reject) => {
        this.request.session.destroy((err) => err ? reject(err) : resolve(true));
      });
    } catch(err) {
      console.error(err.message);
      //
    }
    return false;
  }

  async signInByEmail(args: AuthSignInDto): Promise<UserEntity> {
    const user = await this._getUserByEmailOrUsername(args.email);
    if(user.password) {
      await this._verifyUserPassword(user.password, args.password);
    }else{
      throw new HttpException({
        statusCode:HttpStatus.UNAUTHORIZED,
        message:HttpStatusMessages.UNAUTHORIZED
      },HttpStatus.UNAUTHORIZED);
    }
    this.request.session.user = {
      id: user._id,
      language: user.language,
      roles: user.roles
    };
    return user as UserEntity;
  }

  async signUpByEmail(args: AuthSignUpDto, ipRegLimit = false): Promise<UserEntity> {
    return await withTransaction(async session => {
      const {firstName, lastName, ...data} = args;
      const ipReg = `ip.reg:${this.request.ip}`;
      const counter = await this.redisClient.get(ipReg);
      if(ipRegLimit) {
        if(counter && Number(counter) > 10) {
          throw new HttpException({
            statusCode: HttpStatus.TOO_MANY_REQUESTS
          }, HttpStatus.TOO_MANY_REQUESTS);
        }
      }
      const user = await this._createUserByEmail({
        name: [firstName, lastName].filter(Boolean).join(' '),
        ...data
      }, session);
      this.request.session.user = {
        id: user.id,
        language: user.language,
        roles: user.roles
      };
      if(ipRegLimit) {
        await this.redisClient.set(
          ipReg,
          `${1 + (counter ? Number(counter) : 0)}`,
          'PX',
          24 * 60 * 60 * 1000
        );
      }
      return user;
    });
  }

  async recover({
                  login: username,
                  recoverCode,
                  verifyCode
                }: AuthRecoverDto & {
    recoverCode?: string;
    verifyCode?: string;
  }): Promise<{ redirect: string }> {
    const user = username ? (await this.repoUser.findOne(isEmail(username) ? {email: username} : {username})) : null;
    if(!user && !(recoverCode && verifyCode)) {
      return {redirect: `${process.env.FRONTEND_URL}/error?code=recover`};
    }
    const recoverExistRequest = (user ? md5(`${user.id}:email:recover`) : recoverCode) as string;
    const recoverExist = await this.redisClient.get(recoverExistRequest);
    if(user && recoverExist) {
      return {redirect: `${process.env.FRONTEND_URL}/error?code=recover`};
    } else if(!recoverExist && user) {
      const recoverExistRequestVerify = md5(`${user.id}:email:recover:${randomStringGenerator()}`);
      await this.redisClient.set(
        recoverExistRequest,
        JSON.stringify({
          user: user,
          recoverExistRequestVerify
        }),
        'PX',
        24 * 60 * 60 * 1000
      );
      try {
        console.log('smtp');
        //language by user
        /*this.smtp
          .sendEmail('recover-by-email',{
            appeal:`${user.firstName||user.username||''}`,
            email:user.email,
            recoverExistRequest,
            recoverExistRequestVerify
          })
          .then();*/
      } catch(e) {
        console.error(e.message);
      }
    } else if(recoverExist && verifyCode) {
      const {user, recoverExistRequestVerify} = JSON.parse(recoverExist);
      if(verifyCode === recoverExistRequestVerify) {
        /*if(this.request.session.user&&this.request.session.user.id!==user.id){
          return {redirect:`${process.env.FRONTEND_URL}/error?code=recover`};
        }*/
        this.request.session.user = user;
        await this.redisClient.del(recoverExistRequest);
        return {
          redirect: `${process.env.FRONTEND_URL}/user/restorePassword`
        };
      } else {
        return {redirect: `${process.env.FRONTEND_URL}/error?code=recover`};
      }
    }
    return {redirect: `${process.env.FRONTEND_URL}/error?code=recover`};
  }

  private async _createUserByEmail({password, ...data}, session?: ClientSession) {
    try {
      return (await this.repoUser.create([{
        ...data,
        password: await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
      }], {
        session
      })).pop();
    } catch(e) {
      console.error(e.message);
      switch(e.code) {
        case 11000: {
          if('email' in e.keyValue) throw new HttpException({
            statusCode: HttpStatus.BAD_REQUEST,
            messages: [{
              property: 'email',
              messages: [HttpStatusMessages.EMAIL_ALREADY_EXIST]
            }]
          }, HttpStatus.BAD_REQUEST);
          if('username' in e.keyValue) throw new HttpException({
            statusCode: HttpStatus.BAD_REQUEST,
            messages: [{
              property: 'username',
              messages: [HttpStatusMessages.USERNAME_ALREADY_EXIST]
            }]
          }, HttpStatus.BAD_REQUEST);
          break;
        }
      }
      throw new Error('Internal server error');
    }
  }

  private async _getUserByEmailOrUsername(login: string): Promise<UserEntity & { id?: string }> {
    let criteria = {};
    if(isEmail(login)) {
      criteria['email'] = login;
    } else {
      criteria['username'] = login;
    }
    const user = await this.repoUser
    .findOne(criteria)
    .select([...UserEntityDefaultSelect, 'password', 'roles']);
    if(!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private async _verifyUserPassword(password: string, passwordCheck: string): Promise<boolean> {
    const passwordMatches = await bcrypt.compare(passwordCheck, password);
    if(!passwordMatches) {
      throw new HttpException({
        statusCode: HttpStatus.UNAUTHORIZED,
        messages: [{
          messages: [HttpStatusMessages.UNAUTHORIZED]
        }]
      }, HttpStatus.UNAUTHORIZED);
    }
    return true;
  }

}
