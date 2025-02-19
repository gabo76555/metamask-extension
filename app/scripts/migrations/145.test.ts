import { RpcEndpointType } from '@metamask/network-controller';
import { migrate } from './145';

const version = 145;

describe(`migration #${version}`, () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.INFURA_PROJECT_ID = 'some-infura-project-id';
    process.env.QUICKNODE_MAINNET_URL = 'https://example.quicknode.com/mainnet';
    process.env.QUICKNODE_LINEA_MAINNET_URL =
      'https://example.quicknode.com/linea-mainnet';
    process.env.QUICKNODE_ARBITRUM_URL =
      'https://example.quicknode.com/arbitrum';
    process.env.QUICKNODE_AVALANCHE_URL =
      'https://example.quicknode.com/avalanche';
    process.env.QUICKNODE_OPTIMISM_URL =
      'https://example.quicknode.com/optimism';
    process.env.QUICKNODE_POLYGON_URL = 'https://example.quicknode.com/polygon';
    process.env.QUICKNODE_BASE_URL = 'https://example.quicknode.com/base';
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      process.env[key] = value;
    }
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if NetworkController is missing', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if NetworkController is not an object', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        NetworkController: 'invalidData',
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does not change NetworkController if NetworkController.networkConfigurationsByChainId is missing', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {},
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does not change NetworkController if NetworkController.networkConfigurationsByChainId is not an object', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: 'invalidData',
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does not change NetworkController.networkConfigurationsByChainId if it is empty', async () => {
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {},
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does not update any custom RPC endpoints that use non-Infura URLs', async () => {
    const networkConfigurationsByChainId = {
      '0x1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: 'https://foo.com',
          },
        ],
      },
      '0xe708': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: 'https://foo.com',
          },
        ],
      },
      '0xa4b1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: 'https://foo.com',
          },
        ],
      },
      '0xa86a': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: 'https://foo.com',
          },
        ],
      },
      '0xa': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: 'https://foo.com',
          },
        ],
      },
      '0x89': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: 'https://foo.com',
          },
        ],
      },
      '0x2105': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: 'https://foo.com',
          },
        ],
      },
    };
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId,
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does not update any custom RPC endpoints that contain an Infura URL but do not use our API key', async () => {
    const networkConfigurationsByChainId = {
      '0x1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://foo.infura.io/v3/some-other-api-key`,
          },
        ],
      },
      '0xe708': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://foo.infura.io/v3/some-other-api-key`,
          },
        ],
      },
      '0xa4b1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://foo.infura.io/v3/some-other-api-key`,
          },
        ],
      },
      '0xa86a': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://foo.infura.io/v3/some-other-api-key`,
          },
        ],
      },
      '0xa': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://foo.infura.io/v3/some-other-api-key`,
          },
        ],
      },
      '0x89': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://foo.infura.io/v3/some-other-api-key`,
          },
        ],
      },
      '0x2105': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://foo.infura.io/v3/some-other-api-key`,
          },
        ],
      },
    };
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId,
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('adds failover URLs to known Infura RPC endpoints', async () => {
    const oldNetworkConfigurationsByChainId = {
      '0x1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
          },
        ],
      },
      '0xe708': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
          },
        ],
      },
      '0xa4b1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://arbitrum.infura.io/v3/{infuraProjectId}`,
          },
        ],
      },
      '0xa86a': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://avalanche.infura.io/v3/{infuraProjectId}`,
          },
        ],
      },
      '0xa': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://optimism.infura.io/v3/{infuraProjectId}`,
          },
        ],
      },
      '0x89': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://polygon.infura.io/v3/{infuraProjectId}`,
          },
        ],
      },
      '0x2105': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://base.infura.io/v3/{infuraProjectId}`,
          },
        ],
      },
    };
    const newNetworkConfigurationsByChainId = {
      '0x1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
            failoverUrls: ['https://example.quicknode.com/mainnet'],
          },
        ],
      },
      '0xe708': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
            failoverUrls: ['https://example.quicknode.com/linea-mainnet'],
          },
        ],
      },
      '0xa4b1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://arbitrum.infura.io/v3/{infuraProjectId}`,
            failoverUrls: ['https://example.quicknode.com/arbitrum'],
          },
        ],
      },
      '0xa86a': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://avalanche.infura.io/v3/{infuraProjectId}`,
            failoverUrls: ['https://example.quicknode.com/avalanche'],
          },
        ],
      },
      '0xa': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://optimism.infura.io/v3/{infuraProjectId}`,
            failoverUrls: ['https://example.quicknode.com/optimism'],
          },
        ],
      },
      '0x89': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://polygon.infura.io/v3/{infuraProjectId}`,
            failoverUrls: ['https://example.quicknode.com/polygon'],
          },
        ],
      },
      '0x2105': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://base.infura.io/v3/{infuraProjectId}`,
            failoverUrls: ['https://example.quicknode.com/base'],
          },
        ],
      },
    };
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: oldNetworkConfigurationsByChainId,
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      NetworkController: {
        networkConfigurationsByChainId: newNetworkConfigurationsByChainId,
      },
    });
  });

  it('does not update any Infura RPC endpoints that already have failover URLs defined', async () => {
    const networkConfigurationsByChainId = {
      '0x1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
            failoverUrls: ['https://some.failover.endpoint'],
          },
        ],
      },
      '0xe708': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
            failoverUrls: ['https://some.failover.endpoint'],
          },
        ],
      },
      '0xa4b1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://arbitrum.infura.io/v3/{infuraProjectId}`,
            failoverUrls: ['https://some.failover.endpoint'],
          },
        ],
      },
      '0xa86a': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://avalanche.infura.io/v3/{infuraProjectId}`,
            failoverUrls: ['https://some.failover.endpoint'],
          },
        ],
      },
      '0xa': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://optimism.infura.io/v3/{infuraProjectId}`,
            failoverUrls: ['https://some.failover.endpoint'],
          },
        ],
      },
      '0x89': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://polygon.infura.io/v3/{infuraProjectId}`,
            failoverUrls: ['https://some.failover.endpoint'],
          },
        ],
      },
      '0x2105': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Infura,
            url: `https://base.infura.io/v3/{infuraProjectId}`,
            failoverUrls: ['https://some.failover.endpoint'],
          },
        ],
      },
    };
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId,
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('adds failover URLs to custom RPC endpoints that are actually Infura RPC endpoints in disguise', async () => {
    const oldNetworkConfigurationsByChainId = {
      '0x1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://mainnet.infura.io/v3/some-infura-project-id`,
          },
        ],
      },
      '0xe708': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://linea-mainnet.infura.io/v3/some-infura-project-id`,
          },
        ],
      },
      '0xa4b1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://arbitrum.infura.io/v3/some-infura-project-id`,
          },
        ],
      },
      '0xa86a': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://avalanche.infura.io/v3/some-infura-project-id`,
          },
        ],
      },
      '0xa': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://optimism.infura.io/v3/some-infura-project-id`,
          },
        ],
      },
      '0x89': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://polygon.infura.io/v3/some-infura-project-id`,
          },
        ],
      },
      '0x2105': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://base.infura.io/v3/some-infura-project-id`,
          },
        ],
      },
    };
    const newNetworkConfigurationsByChainId = {
      '0x1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://mainnet.infura.io/v3/some-infura-project-id`,
            failoverUrls: ['https://example.quicknode.com/mainnet'],
          },
        ],
      },
      '0xe708': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://linea-mainnet.infura.io/v3/some-infura-project-id`,
            failoverUrls: ['https://example.quicknode.com/linea-mainnet'],
          },
        ],
      },
      '0xa4b1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://arbitrum.infura.io/v3/some-infura-project-id`,
            failoverUrls: ['https://example.quicknode.com/arbitrum'],
          },
        ],
      },
      '0xa86a': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://avalanche.infura.io/v3/some-infura-project-id`,
            failoverUrls: ['https://example.quicknode.com/avalanche'],
          },
        ],
      },
      '0xa': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://optimism.infura.io/v3/some-infura-project-id`,
            failoverUrls: ['https://example.quicknode.com/optimism'],
          },
        ],
      },
      '0x89': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://polygon.infura.io/v3/some-infura-project-id`,
            failoverUrls: ['https://example.quicknode.com/polygon'],
          },
        ],
      },
      '0x2105': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://base.infura.io/v3/some-infura-project-id`,
            failoverUrls: ['https://example.quicknode.com/base'],
          },
        ],
      },
    };
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: oldNetworkConfigurationsByChainId,
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      NetworkController: {
        networkConfigurationsByChainId: newNetworkConfigurationsByChainId,
      },
    });
  });

  it('does not update any in-disguise Infura RPC endpoints that already have failover URLs defined', async () => {
    const networkConfigurationsByChainId = {
      '0x1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://mainnet.infura.io/v3/some-infura-project-id`,
            failoverUrls: ['https://some.failover.endpoint'],
          },
        ],
      },
      '0xe708': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://linea-mainnet.infura.io/v3/some-infura-project-id`,
            failoverUrls: ['https://some.failover.endpoint'],
          },
        ],
      },
      '0xa4b1': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://arbitrum.infura.io/v3/some-infura-project-id`,
            failoverUrls: ['https://some.failover.endpoint'],
          },
        ],
      },
      '0xa86a': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://avalanche.infura.io/v3/some-infura-project-id`,
            failoverUrls: ['https://some.failover.endpoint'],
          },
        ],
      },
      '0xa': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://optimism.infura.io/v3/some-infura-project-id`,
            failoverUrls: ['https://some.failover.endpoint'],
          },
        ],
      },
      '0x89': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://polygon.infura.io/v3/some-infura-project-id`,
            failoverUrls: ['https://some.failover.endpoint'],
          },
        ],
      },
      '0x2105': {
        rpcEndpoints: [
          {
            type: RpcEndpointType.Custom,
            url: `https://base.infura.io/v3/some-infura-project-id`,
            failoverUrls: ['https://some.failover.endpoint'],
          },
        ],
      },
    };
    const oldStorage = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId,
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
