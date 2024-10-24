import type {Ref} from '@typegoose/typegoose';
import {modelOptions, plugin, prop} from '@typegoose/typegoose';
import {defaultModelOptions, defaultSchemaOptions} from 'app/mongoose.config.js';
import {_BaseEntity} from 'app/entities/_BaseEntity.js';
import {UserEntity} from 'app/entities/User/index.js';
import {UserEntityPublicSelect} from 'app/entities/User/User.js';
import autopopulate from 'mongoose-autopopulate';

export enum PURCHASE_TYPE {
  PURCHASE = 'purchase',
}

@plugin<any>(autopopulate)
@modelOptions({
  ...defaultModelOptions,
  schemaOptions: {
    ...defaultSchemaOptions,
    toJSON: {
      ...defaultSchemaOptions.toJSON,
      virtuals: true,
      transform: (doc, {_id, createdAt, updatedAt, ...rest}) => ({
        id: _id,
        createdAt,
        updatedAt,
        ...rest
      })
    },
    collection: 'purchase'
  }
})
export class PurchasesEntity extends _BaseEntity {
  @prop({required: true})
  value: number;
  @prop({
    enum: PURCHASE_TYPE,
    required: true,
    type: String,
    default: PURCHASE_TYPE.PURCHASE
  })
  type?: PURCHASE_TYPE;
  @prop({
    ref: () => UserEntity,
    autopopulate: {
      select: UserEntityPublicSelect
    },
    required: true
  })
  user!: Ref<UserEntity>;
  @prop({
    required: true
  })
  item!: string;

}

export const PurchasesEntityEntityDefaultSelect = [
  'id',
  'createdAt',
  'value',
  'type',
  'user',
  'item'
];

export default PurchasesEntity;
