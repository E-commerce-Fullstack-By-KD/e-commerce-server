import { RequestMethod } from '@nestjs/common';
import { RouteInfo } from '@nestjs/common/interfaces';

export const PUBLIC_ROUTES: RouteInfo[] = [
  {
    path: 'auth/login',
    method: RequestMethod.POST,
  },
  {
    path: 'auth/signup',
    method: RequestMethod.POST,
  },

  {
    path: 'auth/login',
    method: RequestMethod.POST,
  },
  {
    path: 'uploads/*path',
    method: RequestMethod.GET,
  },
  {
    path: 'product',
    method: RequestMethod.GET,
  },
  {
    path: 'product/:id',
    method: RequestMethod.GET,
  },
  {
    path: 'collection/findAll',
    method: RequestMethod.GET,
  },
];
