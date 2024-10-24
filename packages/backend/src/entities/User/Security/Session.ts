import type {Ref} from '@typegoose/typegoose';
import {modelOptions, prop} from '@typegoose/typegoose';
import {defaultModelOptions, defaultSchemaOptions} from 'app/mongoose.config.js';
import {_BaseEntity} from 'app/entities/_BaseEntity.js';
import {UserEntity} from 'app/entities/User/index.js';

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
    collection: 'user-session'
  }
})
export class UserSessionEntity extends _BaseEntity {
  @prop()
  device?: string;
  @prop()
  ip?: number;
  @prop()
  location?: string;
  @prop({
    ref: () => UserEntity,
    required: true
  })
  user!: Ref<UserEntity>;
}

export const UserSessionEntityDefaultSelect = [
  'device',
  'ip',
  'location'
];
export default UserSessionEntity;
