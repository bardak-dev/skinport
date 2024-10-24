import {Module} from '@nestjs/common';
import {TypegooseModule} from 'nestjs-typegoose';
import {UserService} from 'app/services/User.js';
import {ProfileController} from 'app/controllers/User/Profile.js';
import {UserEntities} from 'app/entities/User/User.js';

@Module({
  imports: [TypegooseModule.forFeature(UserEntities)],
  providers: [
    UserService
  ],
  exports: [UserService],
  controllers: [ProfileController]
})
export class UserModule {
}
