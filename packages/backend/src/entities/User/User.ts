import {index, modelOptions, plugin, prop} from '@typegoose/typegoose';
import autopopulate from 'mongoose-autopopulate';
import {getEmail} from 'app/utils/index.js';
import {defaultModelOptions, defaultSchemaOptions} from 'app/mongoose.config.js';
import {_BaseEntity} from 'app/entities/_BaseEntity.js';

enum USER_LANGUAGES {
  EN = 'en',
  RU = 'ru'
}

enum USER_CURRENCIES {
  USD = 'usd',
  RUB = 'rub'
}


class Wallet {
  @prop({
    required: true,
    min: 0,
    default: 100
  })
  public balance!: number;
}

@plugin<any>(autopopulate)
@modelOptions({
  ...defaultModelOptions,
  schemaOptions: {
    ...defaultSchemaOptions,
    toJSON: {
      ...defaultSchemaOptions.toJSON,
      virtuals: true,
      transform: (_, {_id, createdAt, updatedAt, password, roles, ...rest}) => {
        return {
          id: _id,
          createdAt,
          updatedAt,
          ...rest
        };
      }
    },
    collection: 'user'
  },
  options: {
    customName: 'user'
  }
})
@index(
  {email: 1},
  {
    unique: true,
    sparse: true,
    background: true
  }
)
@index(
  {username: 1},
  {
    unique: true,
    sparse: true,
    background: true
  }
)
export class UserEntity extends _BaseEntity {
  @prop({
    set: (str: string) => str ? getEmail(str) : undefined,
    get: (str: string) => str || null
  })
  email?: string;
  @prop({
    set: (str: string) => str ? str.trim().toLowerCase() : undefined,
    get: (str: string) => str || null
  })
  username?: string;
  @prop({default: false})
  emailVerified?: boolean;
  @prop()
  name?: string;
  @prop({default: null, select: false})
  password?: string;
  @prop({
    enum: USER_LANGUAGES,
    default: USER_LANGUAGES.EN,
    addNullToEnum: true,
    type: String
  })
  language?: USER_LANGUAGES;
  @prop({
    enum: USER_CURRENCIES,
    default: USER_CURRENCIES.USD,
    addNullToEnum: true,
    type: String
  })
  currency?: USER_CURRENCIES;

  @prop({
    _id: false,
    type: () => Wallet,
    default: {
      balance: 0
    }
  })
  wallet!: Wallet;

  @prop({
    default: ['user'],
    type: [String],
    set: (ar: string[] | undefined) =>
      Array.isArray(ar) ? ar.map((str) => str.toLowerCase().trim()) : [],
    get: (ar: string[] | undefined) => ar
  })
  roles?: string[];
}

export const UserEntityDefaultSelect = [
  'id',
  'createdAt',
  'email',
  'emailVerified',
  'name',
  'language',
  'location',
  'currency',
  'username',
  'wallet'
];

export const UserEntityPublicSelect = [
  'id',
  'name',
  'username'
];

export const UserEntities = [
  UserEntity
];
export default UserEntity;
