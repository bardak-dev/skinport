import {Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Redirect} from '@nestjs/common';
import {ApiExcludeEndpoint, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {RedirectResponse} from '@nestjs/core/router/router-response-controller.js';
import {Types} from 'mongoose';
import {AuthService} from 'app/services/Auth.js';
import {Authorized, Unauthorized} from 'app/decorators/auth.js';
import {UserId} from 'app/decorators/user.js';
import {AuthRecoverDto, AuthSignInDto, AuthSignUpDto} from 'app/dto/Auth.js';

@ApiTags('auth')
@Controller('/api')
export class AuthController {
  constructor(
    public service: AuthService
  ) {
  }

  @ApiOperation({summary: 'sign-out user'})
  @Authorized()
  @Post('/rest/auth/sign-out')
  @HttpCode(200)
  async signOut(
    @UserId() userId: Types.ObjectId
  ) {
    return {
      success: await this.service.signOut()
    };
  }

  @ApiExcludeEndpoint(process.env.ENV !== 'development')
  @Authorized()
  @Post('/admin/user/logout')
  @HttpCode(200)
  async logOut(@UserId() userId: Types.ObjectId) {
    return {
      success: await this.service.signOut()
    };
  }

  @Unauthorized()
  @Post('/rest/auth/email/sign-in')
  @HttpCode(200)
  async signIn(@Body() args: AuthSignInDto) {
    return this.service.signInByEmail(args);
  }

  @Unauthorized()
  @Post('/rest/auth/email/sign-up')
  async signUp(@Body() data: AuthSignUpDto) {
    return await this.service.signUpByEmail(data, false);
  }

  @Unauthorized()
  @Post('/rest/auth/email/recover')
  @HttpCode(200)
  async recover(@Body() args: AuthRecoverDto) {
    await this.service.recover(args);
    return {
      success: true
    };
  }

  @ApiExcludeEndpoint(process.env.NODE_ENV !== 'development')
  @Get('/rest/auth/email/recover/:code/:state')
  @Redirect(`${process.env.FRONTEND_URL || '/'}`, HttpStatus.SEE_OTHER)
  @ApiResponse({status: HttpStatus.SEE_OTHER})
  async recoverVerify(
    @Param('code') recoverCode: string,
    @Param('state') verifyCode: string): Promise<RedirectResponse> {
    return {
      url: (await this.service.recover({recoverCode, verifyCode})).redirect,
      statusCode: HttpStatus.SEE_OTHER
    };
  }
}
