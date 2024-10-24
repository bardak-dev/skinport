import {Controller, Get, HttpCode, HttpException, HttpStatus} from '@nestjs/common';
import {ApiOperation, ApiTags} from '@nestjs/swagger';
import {Types} from 'mongoose';
import {UserId} from 'app/decorators/user.js';
import {ItemService} from 'app/services/Item.js';
import {HttpStatusMessages} from 'app/messages/http.js';

@ApiTags('item')
@Controller('/api/rest')
export class ItemController {
  constructor(
    public service: ItemService
  ) {
  }

  @ApiOperation({summary: 'items'})
  @Get('/items')
  @HttpCode(200)
  async itemPurchase(
    @UserId() id: Types.ObjectId
  ) {
    try {
      return await this.service.get();
    } catch(e) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatusMessages.INTERNAL_SERVER_ERROR
        },
        HttpStatus.BAD_REQUEST);
    }
  }
}
