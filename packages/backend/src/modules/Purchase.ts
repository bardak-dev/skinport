import {Module} from '@nestjs/common';
import {TypegooseModule} from 'nestjs-typegoose';
import {UserEntities} from 'app/entities/User/User.js';
import PurchasesEntity from 'app/entities/Purchase.js';
import {PurchaseService} from 'app/services/Purchase.js';
import {PurchaseController} from 'app/controllers/Purchase.js';

@Module({
  imports: [TypegooseModule.forFeature([...UserEntities, PurchasesEntity])],
  providers: [PurchaseService],
  exports: [],
  controllers: [PurchaseController]
})
export class PurchaseModule {
}
