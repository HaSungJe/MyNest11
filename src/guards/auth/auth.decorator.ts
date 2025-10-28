import { SetMetadata } from '@nestjs/common';

export const AUTHS_KEY = 'auths';
export const Auths = (...auths: string[]) => SetMetadata('auths', auths);