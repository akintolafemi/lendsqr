import { tuple } from '@utils/custom.utils';

export const GENDER_MALE = 'male';
export const GENDER_FEMALE = 'female';
export const GENDER_OTHERS = 'others';

export const GENDER_TYPES = tuple(GENDER_FEMALE, GENDER_MALE, GENDER_OTHERS);

export const BCRYPT_HASH_ROUNDS = 10;
