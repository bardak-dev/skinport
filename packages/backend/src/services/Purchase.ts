import {InjectModel} from 'nestjs-typegoose';
import type {ReturnModelType} from '@typegoose/typegoose';
import {ClientSession, Types} from 'mongoose';
import {HttpException, HttpStatus, Injectable, Scope} from '@nestjs/common';
import get from 'lodash.get';
import {UserEntity} from 'app/entities/User/index.js';
import {withTransaction} from 'app/utils/index.js';
import {HttpStatusMessages} from 'app/messages/http.js';
import PurchasesEntity from 'app/entities/Purchase.js';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectModel(UserEntity) private readonly repoUser: ReturnModelType<typeof UserEntity>,
    @InjectModel(PurchasesEntity) private readonly purchase: ReturnModelType<typeof PurchasesEntity>,
  ) {
  }

  async itemPurchase(
    userId: Types.ObjectId,
    item: string,
    existingSession?: ClientSession
  ) {
    return withTransaction(async (session) => {
      const user = await this.repoUser.findById(userId, {}, {autopopulate: false}).select(['wallet']).session(session);
      const balance = get(user, 'wallet.balance', 0);
      //TODO item price from DB or api
      const sum = 0.5;
      if(balance < sum) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: HttpStatusMessages.DONATE_SUM_ERROR
          },
          HttpStatus.BAD_REQUEST);
      }
      const [[transactionCreated], userUpdated] = await Promise.all([
        this.purchase.create([{
          value: sum,
          user: userId,
          item
        }], {session}),
        this.repoUser.findByIdAndUpdate(userId, {
          $inc: {
            'wallet.balance': -sum
          }
        }, {session, autopopulate: false, new: true}).select('wallet')
      ]);
      if(
        !transactionCreated
        || userUpdated?.wallet.balance != balance - sum) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: HttpStatusMessages.INTERNAL_SERVER_ERROR
          },
          HttpStatus.BAD_REQUEST);
      }
      return userUpdated?.wallet;
    }, existingSession);
  }
}
