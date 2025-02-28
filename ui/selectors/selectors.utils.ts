import { getKnownPropertyNames, isObject } from '@metamask/utils';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
  CHAIN_ID_TO_RPC_URL_MAP,
} from '../../shared/constants/network';
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../../shared/constants/swaps';
import { InternalAccountWithBalance } from './selectors.types';

export const isPropertyKeyOf = (
  key: unknown,
  object: Record<PropertyKey, unknown>,
): key is keyof typeof object =>
  getKnownPropertyNames(object).find((propertyName) => key === propertyName) !==
  undefined;

export const isNetworkImageUrlMapChainId = (
  id: unknown,
): id is keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP =>
  isPropertyKeyOf(id, CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP);

export const isSwapsChainId = (
  id: unknown,
): id is keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP =>
  isPropertyKeyOf(id, SWAPS_CHAINID_DEFAULT_TOKEN_MAP);

export const isTokenImageMapChainId = (
  id: unknown,
): id is keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP =>
  isPropertyKeyOf(id, CHAIN_ID_TOKEN_IMAGE_MAP);

export const isRpcNetworkChainId = (
  id: unknown,
): id is keyof typeof CHAIN_ID_TO_RPC_URL_MAP =>
  isPropertyKeyOf(id, CHAIN_ID_TO_RPC_URL_MAP);

export const isInternalAccountWithLastSelectedTimestamp = (
  account: unknown,
): account is InternalAccountWithBalance & {
  connections: boolean;
  lastSelected: number;
} =>
  isObject(account) &&
  'connections' in account &&
  account.connections !== undefined &&
  'lastSelected' in account &&
  account.lastSelected !== undefined;
