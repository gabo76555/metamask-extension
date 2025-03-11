import {
  CHAIN_IDS,
  DEFAULT_CUSTOM_TESTNET,
} from '../../../shared/constants/network';
import {  hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 146;

/**
 * This migration add MegaETH to the network controller
 * as an default avaiable testnet.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: VersionedData) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController) &&
    isObject(state.NetworkController.networkConfigurationsByChainId)
  ) {
    state.NetworkController.networkConfigurationsByChainId[CHAIN_IDS.MEGAETH_TESTNET] = cloneDeep(DEFAULT_CUSTOM_TESTNET[CHAIN_IDS.MEGAETH_TESTNET]);
  }
  return state;
}
