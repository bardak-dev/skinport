import {Injectable} from '@nestjs/common';
import {CacheService} from 'app/services/Cache.js';
import got from 'got';

type ApiItem = {
  market_hash_name: string
  currency: string
  suggested_price: number
  item_page: string
  market_page: string
  min_price: number
  max_price: number
  mean_price: number
  median_price: number
  quantity: number
  created_at: number
  updated_at: number
}

@Injectable()
export class ItemService {
  constructor(
    private readonly cacheService: CacheService
  ) {
  }

  async get(appId = 730) {
    try {
      return this.cacheService.process(`items:${appId}`, async () => {
        const [tradable, notTradable] = await Promise.all([
          got.get<ApiItem[]>('https://api.skinport.com/v1/items', {
            searchParams: {
              app_id: appId,
              tradable: 1
            },
            timeout: {
              request: 5 * 60 * 1000 / 8 / 2 // rate limit reset
            },
            responseType: 'json',
            resolveBodyOnly: true
          }),
          got.get<ApiItem[]>('https://api.skinport.com/v1/items', {
            searchParams: {
              app_id: appId,
              tradable: 0
            },
            timeout: {
              request: 5 * 60 * 1000 / 8 / 2 // rate limit reset
            },
            responseType: 'json',
            resolveBodyOnly: true
          })
        ]);
        const [
          itemsTradable,
          itemsNotTradable
        ] = [
          tradable.reduce<{ [k: string]: ApiItem }>((items, item) => {
            items[item.item_page] = item;
            return items;
          }, {}),
          notTradable.reduce<{ [k: string]: ApiItem }>((items, item) => {
            items[item.item_page] = item;
            return items;
          }, {})
        ];

        return [...new Set([
          ...Array.from<string>(Object.keys(itemsTradable)),
          ...Array.from<string>(Object.keys(itemsNotTradable))
        ])].reduce((items, item_page) => {
          const itemTradable = itemsTradable[item_page];
          const itemNotTradable = itemsNotTradable[item_page];
          return [...items, {
            ...(itemNotTradable || itemTradable),
            min_price: [
              itemTradable && {
                price: itemTradable.min_price,
                tradable: true
              },
              itemNotTradable && {
                price: itemNotTradable.min_price,
                tradable: false
              }
            ].filter(Boolean)
          }];
        }, []);
      }, 5 * 60 /* 5 min */);
    } catch(e) {
      console.error(e);
    }
  }
}
