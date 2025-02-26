import { RpcEndpointType } from '@metamask/network-controller';
import { getErrorMessage, hasProperty, Hex, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const VERSION = 145;

// Chains supported by Infura that are either built in or featured,
// mapped to their corresponding failover URLs.
// Copied from `FEATURED_RPCS` in shared/constants/network.ts:
// <https://github.com/MetaMask/metamask-extension/blob/f28216fad810d138dab8577fe9bdb39f5b6d18d8/shared/constants/network.ts#L1051>
export const INFURA_CHAINS_WITH_FAILOVERS: Map<
  Hex,
  { subdomain: string; getFailoverUrl: () => string | undefined }
> = new Map([
  [
    '0x1',
    {
      subdomain: 'mainnet',
      getFailoverUrl: () => process.env.QUICKNODE_MAINNET_URL,
    },
  ],
  // linea mainnet
  [
    '0xe708',
    {
      subdomain: 'linea-mainnet',
      getFailoverUrl: () => process.env.QUICKNODE_LINEA_MAINNET_URL,
    },
  ],
  [
    '0xa4b1',
    {
      subdomain: 'arbitrum',
      getFailoverUrl: () => process.env.QUICKNODE_ARBITRUM_URL,
    },
  ],
  [
    '0xa86a',
    {
      subdomain: 'avalanche',
      getFailoverUrl: () => process.env.QUICKNODE_AVALANCHE_URL,
    },
  ],
  [
    '0xa',
    {
      subdomain: 'optimism',
      getFailoverUrl: () => process.env.QUICKNODE_OPTIMISM_URL,
    },
  ],
  [
    '0x89',
    {
      subdomain: 'polygon',
      getFailoverUrl: () => process.env.QUICKNODE_POLYGON_URL,
    },
  ],
  [
    '0x2105',
    {
      subdomain: 'base',
      getFailoverUrl: () => process.env.QUICKNODE_BASE_URL,
    },
  ],
]);

/**
 * This migration ensures that all RPC endpoints that hit Infura and use our API
 * key are Infura RPC endpoints and not custom RPC endpoints.
 *
 * @param originalVersionedData - The original MetaMask extension state.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  try {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = VERSION;
    transformState(versionedData.data);
    return versionedData;
  } catch (error) {
    const newError = new Error(
      `Migration #${VERSION}: ${getErrorMessage(error)}`,
    );
    if (global.sentry) {
      global.sentry.captureException(newError);
    }
    return originalVersionedData;
  }
}

function transformState(state: Record<string, unknown>) {
  if (process.env.INFURA_PROJECT_ID === undefined) {
    throw new Error('No INFURA_PROJECT_ID');
  }

  if (!hasProperty(state, 'NetworkController')) {
    throw new Error('Missing NetworkController state');
  }

  if (
    !isObject(state.NetworkController) ||
    !hasProperty(state.NetworkController, 'networkConfigurationsByChainId') ||
    !isObject(state.NetworkController.networkConfigurationsByChainId)
  ) {
    throw new Error('Invalid NetworkController state');
  }

  for (const [
    chainId,
    { subdomain, getFailoverUrl },
  ] of INFURA_CHAINS_WITH_FAILOVERS) {
    const networkConfiguration =
      state.NetworkController.networkConfigurationsByChainId[chainId];

    if (!networkConfiguration) {
      continue;
    }

    if (
      !isObject(networkConfiguration) ||
      !hasProperty(networkConfiguration, 'rpcEndpoints') ||
      !Array.isArray(networkConfiguration.rpcEndpoints)
    ) {
      continue;
    }

    const infuraLikeRpcEndpoint = networkConfiguration.rpcEndpoints.find(
      (rpcEndpoint) => {
        if (rpcEndpoint.type === RpcEndpointType.Infura) {
          return true;
        }

        // All featured networks that use Infura get added as custom RPC
        // endpoints, not Infura RPC endpoints
        const match = rpcEndpoint.url.match(
          new RegExp(
            `https://(.+?)\\.infura\\.io/v3/${process.env.INFURA_PROJECT_ID}`,
            'u',
          ),
        );
        return match && match[1] === subdomain;
      },
    );

    const failoverUrl = getFailoverUrl();

    if (failoverUrl === undefined) {
      throw new Error('No failover URL to set');
    }

    if (
      !infuraLikeRpcEndpoint ||
      !isObject(infuraLikeRpcEndpoint) ||
      hasProperty(infuraLikeRpcEndpoint, 'failoverUrls')
    ) {
      continue;
    }

    infuraLikeRpcEndpoint.failoverUrls = [failoverUrl];
  }
}
