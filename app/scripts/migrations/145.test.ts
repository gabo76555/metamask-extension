import { RpcEndpointType } from '@metamask/network-controller';
import { migrate } from './145';

const VERSION = 145;

const INFURA_PROJECT_ID = 'some-infura-project-id';
const QUICKNODE_MAINNET_URL = 'https://example.quicknode.com/mainnet';
const QUICKNODE_LINEA_MAINNET_URL =
  'https://example.quicknode.com/linea-mainnet';
const QUICKNODE_ARBITRUM_URL = 'https://example.quicknode.com/arbitrum';
const QUICKNODE_AVALANCHE_URL = 'https://example.quicknode.com/avalanche';
const QUICKNODE_OPTIMISM_URL = 'https://example.quicknode.com/optimism';
const QUICKNODE_POLYGON_URL = 'https://example.quicknode.com/polygon';
const QUICKNODE_BASE_URL = 'https://example.quicknode.com/base';

describe(`migration #${VERSION}`, () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_MAINNET_URL = QUICKNODE_MAINNET_URL;
    process.env.QUICKNODE_LINEA_MAINNET_URL = QUICKNODE_LINEA_MAINNET_URL;
    process.env.QUICKNODE_ARBITRUM_URL = QUICKNODE_ARBITRUM_URL;
    process.env.QUICKNODE_AVALANCHE_URL = QUICKNODE_AVALANCHE_URL;
    process.env.QUICKNODE_OPTIMISM_URL = QUICKNODE_OPTIMISM_URL;
    process.env.QUICKNODE_POLYGON_URL = QUICKNODE_POLYGON_URL;
    process.env.QUICKNODE_BASE_URL = QUICKNODE_BASE_URL;
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      process.env[key] = value;
    }
  });

  it('does nothing if NetworkController is missing', async () => {
    const oldStorage = {
      meta: { version: VERSION - 1 },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toBe(oldStorage);
  });

  it('does nothing if NetworkController is not an object', async () => {
    const oldStorage = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: 'not-an-object',
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toBe(oldStorage);
  });

  it('does nothing if NetworkController.networkConfigurationsByChainId is missing', async () => {
    const oldStorage = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {},
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toBe(oldStorage);
  });

  it('does not change NetworkController if NetworkController.networkConfigurationsByChainId is not an object', async () => {
    const oldStorage = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: 'not-an-object',
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toBe(oldStorage);
  });

  it('does not change NetworkController.networkConfigurationsByChainId if it is empty', async () => {
    const oldStorage = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {},
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: { version: VERSION },
      data: oldStorage.data,
    });
  });

  it('does not update any network configurations that are not objects', async () => {
    const oldStorage = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': 'not-an-object',
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': 'not-an-object',
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
          },
        },
      },
    });
  });

  it('does not update any network configurations that do not have rpcEndpoints', async () => {
    const oldStorage = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {},
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {},
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
          },
        },
      },
    });
  });

  it('does not update any custom RPC endpoints that use non-Infura URLs', async () => {
    const oldStorage = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
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
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
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
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
          },
        },
      },
    });
  });

  it('does not update any custom RPC endpoints that contain an Infura URL but do not use our API key', async () => {
    const oldStorage = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: 'https://mainnet.infura.io/v3/some-other-api-key',
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
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: 'https://mainnet.infura.io/v3/some-other-api-key',
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
          },
        },
      },
    });
  });

  it('adds failover URLs to known Infura RPC endpoints', async () => {
    const oldStorage = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
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
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_MAINNET_URL],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://arbitrum.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_ARBITRUM_URL],
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://avalanche.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_AVALANCHE_URL],
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://optimism.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_OPTIMISM_URL],
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://polygon.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_POLYGON_URL],
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://base.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_BASE_URL],
                },
              ],
            },
          },
        },
      },
    });
  });

  it('does not update any Infura RPC endpoints that already have failover URLs defined', async () => {
    const oldStorage = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: ['https://foo.com'],
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
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: ['https://foo.com'],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
          },
        },
      },
    });
  });

  it('adds failover URLs to custom RPC endpoints that are actually Infura RPC endpoints in disguise', async () => {
    const oldStorage = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://linea-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://arbitrum.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://avalanche.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://optimism.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://polygon.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://base.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_MAINNET_URL],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://linea-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://arbitrum.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_ARBITRUM_URL],
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://avalanche.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_AVALANCHE_URL],
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://optimism.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_OPTIMISM_URL],
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://polygon.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_POLYGON_URL],
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://base.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_BASE_URL],
                },
              ],
            },
          },
        },
      },
    });
  });

  it('does not update any in-disguise Infura RPC endpoints that already have failover URLs defined', async () => {
    const oldStorage = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: ['https://foo.com'],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://linea-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: ['https://foo.com'],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://linea-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
          },
        },
      },
    });
  });
});
