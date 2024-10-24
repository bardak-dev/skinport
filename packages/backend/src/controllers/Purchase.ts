import {Body, Controller, HttpCode, Post} from '@nestjs/common';
import {ApiOperation, ApiTags} from '@nestjs/swagger';
import {Types} from 'mongoose';
import {Authorized} from 'app/decorators/auth.js';
import {UserId} from 'app/decorators/user.js';
import {PurchaseService} from 'app/services/Purchase.js';
import {PurchaseItemDto} from 'app/dto/Purchase.js';

@ApiTags('purchase')
@Controller('/api/rest/purchase')
export class PurchaseController {
  constructor(
    public service: PurchaseService
  ) {
  }

  @ApiOperation({summary: 'purchase item'})
  @Authorized()
  @Post('/item')
  @HttpCode(200)
  async itemPurchase(
    @UserId() id: Types.ObjectId,
    @Body() {item}: PurchaseItemDto
  ) {
    return this.service.itemPurchase(id, item);
  }
}
