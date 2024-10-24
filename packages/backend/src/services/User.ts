import {HttpException, HttpStatus, Inject, Injectable, Scope, UnauthorizedException} from '@nestjs/common';
import {InjectModel} from 'nestjs-typegoose';
import type {ReturnModelType} from '@typegoose/typegoose';
import {Types} from 'mongoose';
import {REQUEST} from '@nestjs/core';
import bcrypt from 'bcrypt';
import {UserEntity, UserEntityDefaultSelect} from 'app/entities/User/index.js';
import {UpdateProfileDto} from 'app/dto/Profile.js';
import {BCRYPT_SALT_ROUNDS} from 'app/constants.js';
import {HttpStatusMessages} from 'app/messages/http.js';

@Injectable({scope: Scope.REQUEST})
export class UserService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    @InjectModel(UserEntity) private readonly repo: ReturnModelType<typeof UserEntity>
  ) {
  }

  async findById(id?: Types.ObjectId): Promise<UserEntity | null> {
    if(!id) return null;
    return this.repo.findById(id).select(UserEntityDefaultSelect);
  }

  async me(id: Types.ObjectId, email?: string, fields: (keyof UserEntity)[] = []) {
    const user = await this.findByIdOrEmail(id, email, []);
    if(!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async findByIdAndUpdate(
    id: Types.ObjectId,
    args: UpdateProfileDto,
    userData = undefined
  ): Promise<any | null> {
    const getUser = async () => {
      if(!userData) {
        userData = await this.repo.findById(id).select(['email']);
      }
      return userData;
    };
    const {...data} = args;
    if(data.email) {
      const oldEmail = (await getUser())?.email;
      if(data.email !== oldEmail) {
        data['emailVerified'] = false;
      }
    }
    if(data.password) {
      data['password'] = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);
    }
    try {
      const user = (await this.repo
        .findByIdAndUpdate(id, data, {new: true})
        .select(UserEntityDefaultSelect)
      )?.toJSON();
      if(!user) return null;
      this.request.session.user.language = user.language;
      return user;
    } catch(e) {
      console.error(e.message);
      switch(e.code) {
        case 11000: {
          if('username' in e.keyValue)
            throw new HttpException([HttpStatusMessages.USERNAME_ALREADY_EXIST], HttpStatus.CONFLICT);
          break;
        }
      }
      throw new Error('Internal server error');
    }
  }

  async findByIdAndDelete(
    userId: Types.ObjectId
  ): Promise<boolean> {
    try {
      await this.repo.findByIdAndDelete(userId);
      await new Promise((resolve, reject) => {
        this.request.session.destroy((err) => err ? reject(err) : resolve(true));
      });
    } catch(err) {
      console.error(err.message);
      //
    }
    return true;
  }

  async findByIdOrEmail(_id: Types.ObjectId, email?: string, fields: (keyof UserEntity)[] = []): Promise<any | null> {
    if(!_id && !email) return null;
    const select = await this.repo
    .findOne(
      _id && email
        ? {
          $or: [
            {
              _id
            },
            {
              email
            }
          ]
        }
        : _id
          ? {_id}
          : {email}
    )
    .select([...UserEntityDefaultSelect, ...fields]);
    return select;
  }
}
