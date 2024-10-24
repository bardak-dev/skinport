import {Base, TimeStamps} from '@typegoose/typegoose/lib/defaultClasses.js';
import {Types} from 'mongoose';

export abstract class _BaseEntity extends TimeStamps implements Base {
  _id: Types.ObjectId;
  id: string;
}
