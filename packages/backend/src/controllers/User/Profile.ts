import {Body, Controller, Delete, Get, HttpCode, Put} from '@nestjs/common';
import {Types} from 'mongoose';
import {ApiOperation, ApiTags} from '@nestjs/swagger';
import {UserService} from 'app/services/User.js';
import {UserEmail, UserId} from 'app/decorators/user.js';
import {Authorized} from 'app/decorators/auth.js';
import {UpdateProfileDto} from 'app/dto/Profile.js';

@ApiTags('profile')
@Controller('/api/rest/profile')
export class ProfileController {
  constructor(
    public service: UserService
  ) {
  }

  @ApiOperation({summary: 'get profile'})
  @Get()
  @HttpCode(200)
  async meAdmin(
    @UserId() id?: Types.ObjectId,
    @UserEmail() email?: string
  ) {
    return this.service.me(id, email, ['roles']);
  }

  @ApiOperation({summary: 'update profile'})
  @Authorized()
  @Put()
  async update(
    @UserId() id: Types.ObjectId,
    @Body() args: UpdateProfileDto
  ) {
    return this.service.findByIdAndUpdate(id, args);
  }

  @ApiOperation({summary: 'delete user profile'})
  @Authorized()
  @Delete('delete')
  async profileDelete(
    @UserId() id: Types.ObjectId
  ) {
    return this.service.findByIdAndDelete(id);
  }
}
