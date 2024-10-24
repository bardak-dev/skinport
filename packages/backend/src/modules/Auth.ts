import {Module} from '@nestjs/common';
import {TypegooseModule} from 'nestjs-typegoose';
import {AuthService} from 'app/services/Auth.js';
import {UserEntities} from 'app/entities/User/User.js';
import {AuthController} from 'app/controllers/Auth/Auth.js';

@Module({
  imports: [TypegooseModule.forFeature([...UserEntities])],
  providers: [AuthService],
  exports: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {
}
