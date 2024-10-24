import {Module} from '@nestjs/common';
import {CacheService} from 'app/services/Cache.js';
import {ItemController} from 'app/controllers/Item.js';
import {ItemService} from 'app/services/Item.js';

@Module({
  imports: [],
  providers: [ItemService, CacheService],
  exports: [ItemService],
  controllers: [ItemController]
})
export class ItemModule {
}
