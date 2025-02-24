import { StateMetadata } from '@metamask/base-controller';
import { StaticIntervalPollingController } from '@metamask/polling-controller';
import { Hex } from '@metamask/utils';
// eslint-disable-next-line import/no-restricted-paths
import {
  StatusTypes,
  BridgeStatusControllerState,
  StartPollingForBridgeTxStatusArgsSerialized,
  BridgeStatusState,
} from '../../../../shared/types/bridge-status';
import { decimalToPrefixedHex } from '../../../../shared/modules/conversion.utils';
import {
  BRIDGE_STATUS_CONTROLLER_NAME,
  DEFAULT_BRIDGE_STATUS_STATE,
  REFRESH_INTERVAL_MS,
} from './constants';
import type { BridgeStatusControllerMessenger } from './types';
import { fetchBridgeTxStatus, getStatusRequestWithSrcTxHash } from './utils';

const metadata: StateMetadata<BridgeStatusControllerState> = {
  // We want to persist the bridge status state so that we can show the proper data for the Activity list
  // basically match the behavior of TransactionController
  bridgeStatusState: {
    persist: true,
    anonymous: false,
  },
};

/** The input to start polling for the {@link BridgeStatusController} */
type BridgeStatusPollingInput = FetchBridgeTxStatusArgs;

type SrcTxMetaId = string;
export type FetchBridgeTxStatusArgs = {
  bridgeTxMetaId: string;
};
export default class BridgeStatusController extends StaticIntervalPollingController<BridgeStatusPollingInput>()<
  typeof BRIDGE_STATUS_CONTROLLER_NAME,
  BridgeStatusControllerState,
  BridgeStatusControllerMessenger
> {
  #pollingTokensByTxMetaId: Record<SrcTxMetaId, string> = {};

  constructor({
    messenger,
    state,
  }: {
    messenger: BridgeStatusControllerMessenger;
    state?: { bridgeStatusState?: Partial<BridgeStatusState> };
  }) {
    super({
      name: BRIDGE_STATUS_CONTROLLER_NAME,
      metadata,
      messenger,
      // Restore the persisted state
      state: {
        ...state,
        bridgeStatusState: {
          ...DEFAULT_BRIDGE_STATUS_STATE,
          ...state?.bridgeStatusState,
        },
      },
    });

    // Register action handlers
    this.messagingSystem.registerActionHandler(
      `${BRIDGE_STATUS_CONTROLLER_NAME}:startPollingForBridgeTxStatus`,
      this.startPollingForBridgeTxStatus.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      `${BRIDGE_STATUS_CONTROLLER_NAME}:wipeBridgeStatus`,
      this.wipeBridgeStatus.bind(this),
    );

    // Set interval
    this.setIntervalLength(REFRESH_INTERVAL_MS);

    // If you close the extension, but keep the browser open, the polling continues
    // If you close the browser, the polling stops
    // Check for historyItems that do not have a status of complete and restart polling
    this.#restartPollingForIncompleteHistoryItems();
  }

  resetState = () => {
    this.update((_state) => {
      _state.bridgeStatusState = {
        ...DEFAULT_BRIDGE_STATUS_STATE,
      };
    });
  };

  wipeBridgeStatus = ({
    address,
    ignoreNetwork,
  }: {
    address: string;
    ignoreNetwork: boolean;
  }) => {
    // Wipe all networks for this address
    if (ignoreNetwork) {
      this.update((_state) => {
        _state.bridgeStatusState = {
          ...DEFAULT_BRIDGE_STATUS_STATE,
        };
      });
    } else {
      const { selectedNetworkClientId } = this.messagingSystem.call(
        'NetworkController:getState',
      );
      const selectedNetworkClient = this.messagingSystem.call(
        'NetworkController:getNetworkClientById',
        selectedNetworkClientId,
      );
      const selectedChainId = selectedNetworkClient.configuration.chainId;

      this.#wipeBridgeStatusByChainId(address, selectedChainId);
    }
  };

  #restartPollingForIncompleteHistoryItems = () => {
    // Check for historyItems that do not have a status of complete and restart polling
    const { bridgeStatusState } = this.state;
    const historyItems = Object.values(bridgeStatusState.txHistory);
    const incompleteHistoryItems = historyItems
      .filter(
        (historyItem) =>
          historyItem.status.status === StatusTypes.PENDING ||
          historyItem.status.status === StatusTypes.UNKNOWN,
      )
      .filter((historyItem) => {
        // Check if we are already polling this tx, if so, skip restarting polling for that
        const srcTxMetaId = historyItem.txMetaId;
        const pollingToken = this.#pollingTokensByTxMetaId[srcTxMetaId];
        return !pollingToken;
      });

    incompleteHistoryItems.forEach((historyItem) => {
      const bridgeTxMetaId = historyItem.txMetaId;

      // We manually call startPolling() here rather than go through startPollingForBridgeTxStatus()
      // because we don't want to overwrite the existing historyItem in state
      this.#pollingTokensByTxMetaId[bridgeTxMetaId] = this.startPolling({
        bridgeTxMetaId,
      });
    });
  };

  startPollingForBridgeTxStatus = (
    startPollingForBridgeTxStatusArgs: StartPollingForBridgeTxStatusArgsSerialized,
  ) => {
    const {
      bridgeTxMeta,
      statusRequest,
      quoteResponse,
      startTime,
      slippagePercentage,
      initialDestAssetBalance,
      targetContractAddress,
    } = startPollingForBridgeTxStatusArgs;
    const { bridgeStatusState } = this.state;
    const { address: account } = this.#getSelectedAccount();

    // Write all non-status fields to state so we can reference the quote in Activity list without the Bridge API
    // We know it's in progress but not the exact status yet
    const txHistoryItem = {
      txMetaId: bridgeTxMeta.id,
      quote: quoteResponse.quote,
      startTime,
      estimatedProcessingTimeInSeconds:
        quoteResponse.estimatedProcessingTimeInSeconds,
      slippagePercentage,
      pricingData: {
        amountSent: quoteResponse.sentAmount.amount,
        amountSentInUsd: quoteResponse.sentAmount.usd ?? undefined,
        quotedGasInUsd: quoteResponse.gasFee.usd ?? undefined,
        quotedReturnInUsd: quoteResponse.toTokenAmount.usd ?? undefined,
      },
      initialDestAssetBalance,
      targetContractAddress,
      account,
      status: {
        // We always have a PENDING status when we start polling for a tx, don't need the Bridge API for that
        // Also we know the bare minimum fields for status at this point in time
        status: StatusTypes.PENDING,
        srcChain: {
          chainId: statusRequest.srcChainId,
          txHash: statusRequest.srcTxHash,
        },
      },
      hasApprovalTx: Boolean(quoteResponse.approval),
    };
    this.update((_state) => {
      _state.bridgeStatusState = {
        ...bridgeStatusState,
        txHistory: {
          ...bridgeStatusState.txHistory,
          // Use the txMeta.id as the key so we can reference the txMeta in TransactionController
          [bridgeTxMeta.id]: txHistoryItem,
        },
      };
    });

    this.#pollingTokensByTxMetaId[bridgeTxMeta.id] = this.startPolling({
      bridgeTxMetaId: bridgeTxMeta.id,
    });
  };

  startPollingForSwapTxStatus = (
    startPollingForSwapTxStatusArgs: StartPollingForBridgeTxStatusArgsSerialized,
  ) => {
    const {
      bridgeTxMeta,
      statusRequest,
      quoteResponse,
      startTime,
      slippagePercentage,
    } = startPollingForSwapTxStatusArgs;
    const { bridgeStatusState } = this.state;
    const { address: account } = this.#getSelectedAccount();

    // Create swap history item
    const swapHistoryItem = {
      txMetaId: bridgeTxMeta.id,
      quote: quoteResponse.quote,
      startTime,
      estimatedProcessingTimeInSeconds:
        quoteResponse.estimatedProcessingTimeInSeconds,
      slippagePercentage,
      pricingData: {
        amountSent: quoteResponse.sentAmount.amount,
        amountSentInUsd: quoteResponse.sentAmount.usd ?? undefined,
        quotedGasInUsd: quoteResponse.gasFee.usd ?? undefined,
        quotedReturnInUsd: quoteResponse.toTokenAmount.usd ?? undefined,
      },
      account,
      status: {
        status: StatusTypes.PENDING,
        srcChain: {
          chainId: statusRequest.srcChainId,
          txHash: statusRequest.srcTxHash,
        },
      },
      hasApprovalTx: Boolean(quoteResponse.approval),
    };

    // Add to state
    this.update((_state) => {
      _state.bridgeStatusState = {
        ...bridgeStatusState,
        swapHistory: {
          ...bridgeStatusState.swapHistory,
          [bridgeTxMeta.id]: swapHistoryItem,
        },
      };
    });

    // Start polling
    this.#pollingTokensByTxMetaId[bridgeTxMeta.id] = this.startPolling({
      bridgeTxMetaId: bridgeTxMeta.id,
    });
  };

  #executePoll = async (pollingInput: BridgeStatusPollingInput) => {
    const { bridgeTxMetaId } = pollingInput;
    const { bridgeStatusState } = this.state;

    // Check if this is a bridge or swap transaction
    if (bridgeTxMetaId in bridgeStatusState.txHistory) {
      await this.#fetchBridgeTxStatus(pollingInput);
    } else if (bridgeTxMetaId in bridgeStatusState.swapHistory) {
      await this.#fetchSwapTxStatus(pollingInput);
    }
  };

  #getSelectedAccount() {
    const account = this.messagingSystem.call(
      'AccountsController:getSelectedMultichainAccount',
    );
    if (!account) {
      throw new Error('No selected account found');
    }
    return { address: account.id };
  }

  #fetchBridgeTxStatus = async ({
    bridgeTxMetaId,
  }: FetchBridgeTxStatusArgs) => {
    const { bridgeStatusState } = this.state;

    try {
      // We try here because we receive 500 errors from Bridge API if we try to fetch immediately after submitting the source tx
      // Oddly mostly happens on Optimism, never on Arbitrum. By the 2nd fetch, the Bridge API responds properly.
      // Also srcTxHash may not be available immediately for STX, so we don't want to fetch in those cases
      const historyItem = bridgeStatusState.txHistory[bridgeTxMetaId];
      const srcTxHash = this.#getSrcTxHash(bridgeTxMetaId);
      if (!srcTxHash) {
        return;
      }

      this.#updateSrcTxHash(bridgeTxMetaId, srcTxHash);

      const statusRequest = getStatusRequestWithSrcTxHash(
        historyItem.quote,
        srcTxHash,
      );
      const status = await fetchBridgeTxStatus(statusRequest);
      const newBridgeHistoryItem = {
        ...historyItem,
        status,
        completionTime:
          status.status === StatusTypes.COMPLETE ||
          status.status === StatusTypes.FAILED
            ? Date.now()
            : undefined, // TODO make this more accurate by looking up dest txHash block time
      };

      // No need to purge these on network change or account change, TransactionController does not purge either.
      // TODO In theory we can skip checking status if it's not the current account/network
      // we need to keep track of the account that this is associated with as well so that we don't show it in Activity list for other accounts
      // First stab at this will not stop polling when you are on a different account
      this.update((_state) => {
        _state.bridgeStatusState = {
          ...bridgeStatusState,
          txHistory: {
            ...bridgeStatusState.txHistory,
            [bridgeTxMetaId]: newBridgeHistoryItem,
          },
        };
      });

      const pollingToken = this.#pollingTokensByTxMetaId[bridgeTxMetaId];

      if (
        (status.status === StatusTypes.COMPLETE ||
          status.status === StatusTypes.FAILED) &&
        pollingToken
      ) {
        this.stopPollingByPollingToken(pollingToken);

        if (status.status === StatusTypes.COMPLETE) {
          this.messagingSystem.publish(
            `${BRIDGE_STATUS_CONTROLLER_NAME}:bridgeTransactionComplete`,
            { bridgeHistoryItem: newBridgeHistoryItem },
          );
        }
        if (status.status === StatusTypes.FAILED) {
          this.messagingSystem.publish(
            `${BRIDGE_STATUS_CONTROLLER_NAME}:bridgeTransactionFailed`,
            { bridgeHistoryItem: newBridgeHistoryItem },
          );
        }
      }
    } catch (e) {
      console.log('Failed to fetch bridge tx status', e);
    }
  };

  #fetchSwapTxStatus = async ({
    bridgeTxMetaId,
  }: FetchBridgeTxStatusArgs) => {
    const { bridgeStatusState } = this.state;

    try {
      const historyItem = bridgeStatusState.swapHistory[bridgeTxMetaId];
      const srcTxHash = this.#getSrcTxHash(bridgeTxMetaId);
      if (!srcTxHash) {
        return;
      }

      this.#updateSrcTxHash(bridgeTxMetaId, srcTxHash);

      const statusRequest = getStatusRequestWithSrcTxHash(
        historyItem.quote,
        srcTxHash,
      );
      const status = await fetchBridgeTxStatus(statusRequest);
      const newSwapHistoryItem = {
        ...historyItem,
        status,
        completionTime:
          status.status === StatusTypes.COMPLETE ||
          status.status === StatusTypes.FAILED
            ? Date.now()
            : undefined,
      };

      this.update((_state) => {
        _state.bridgeStatusState = {
          ...bridgeStatusState,
          swapHistory: {
            ...bridgeStatusState.swapHistory,
            [bridgeTxMetaId]: newSwapHistoryItem,
          },
        };
      });

      const pollingToken = this.#pollingTokensByTxMetaId[bridgeTxMetaId];

      if (
        (status.status === StatusTypes.COMPLETE ||
          status.status === StatusTypes.FAILED) &&
        pollingToken
      ) {
        this.stopPollingByPollingToken(pollingToken);

        if (status.status === StatusTypes.COMPLETE) {
          this.messagingSystem.publish(
            `${BRIDGE_STATUS_CONTROLLER_NAME}:swapTransactionComplete`,
            { swapHistoryItem: newSwapHistoryItem },
          );
        }
        if (status.status === StatusTypes.FAILED) {
          this.messagingSystem.publish(
            `${BRIDGE_STATUS_CONTROLLER_NAME}:swapTransactionFailed`,
            { swapHistoryItem: newSwapHistoryItem },
          );
        }
      }
    } catch (e) {
      console.log('Failed to fetch swap tx status', e);
    }
  };

  #getSrcTxHash = (bridgeTxMetaId: string): string | undefined => {
    const { bridgeStatusState } = this.state;

    // Check both histories for the transaction
    const bridgeHistoryItem = bridgeStatusState.txHistory[bridgeTxMetaId];
    const swapHistoryItem = bridgeStatusState.swapHistory[bridgeTxMetaId];

    // Get hash from whichever history has the transaction
    const srcTxHash = bridgeHistoryItem?.status.srcChain.txHash ||
                     swapHistoryItem?.status.srcChain.txHash;

    if (srcTxHash) {
      return srcTxHash;
    }

    // Look up in TransactionController if txMeta has been updated with the srcTxHash
    const txControllerState = this.messagingSystem.call(
      'TransactionController:getState',
    );
    const txMeta = txControllerState.transactions.find(
      (tx) => tx.id === bridgeTxMetaId,
    );
    return txMeta?.hash;
  };

  #updateSrcTxHash = (bridgeTxMetaId: string, srcTxHash: string) => {
    const { bridgeStatusState } = this.state;

    // Check which history has the transaction
    const isBridgeTx = bridgeTxMetaId in bridgeStatusState.txHistory;
    const isSwapTx = bridgeTxMetaId in bridgeStatusState.swapHistory;

    // Only update if hash not already set
    if (isBridgeTx && !bridgeStatusState.txHistory[bridgeTxMetaId].status.srcChain.txHash) {
      this.update((_state) => {
        _state.bridgeStatusState = {
          ...bridgeStatusState,
          txHistory: {
            ...bridgeStatusState.txHistory,
            [bridgeTxMetaId]: {
              ...bridgeStatusState.txHistory[bridgeTxMetaId],
              status: {
                ...bridgeStatusState.txHistory[bridgeTxMetaId].status,
                srcChain: {
                  ...bridgeStatusState.txHistory[bridgeTxMetaId].status.srcChain,
                  txHash: srcTxHash,
                },
              },
            },
          },
        };
      });
    } else if (isSwapTx && !bridgeStatusState.swapHistory[bridgeTxMetaId].status.srcChain.txHash) {
      this.update((_state) => {
        _state.bridgeStatusState = {
          ...bridgeStatusState,
          swapHistory: {
            ...bridgeStatusState.swapHistory,
            [bridgeTxMetaId]: {
              ...bridgeStatusState.swapHistory[bridgeTxMetaId],
              status: {
                ...bridgeStatusState.swapHistory[bridgeTxMetaId].status,
                srcChain: {
                  ...bridgeStatusState.swapHistory[bridgeTxMetaId].status.srcChain,
                  txHash: srcTxHash,
                },
              },
            },
          },
        };
      });
    }
  };

  // Wipes the bridge status for the given address and chainId
  // Will match only source chainId to the selectedChainId
  #wipeBridgeStatusByChainId = (address: string, selectedChainId: Hex) => {
    const sourceTxMetaIdsToDelete = Object.keys(
      this.state.bridgeStatusState.txHistory,
    ).filter((txMetaId) => {
      const bridgeHistoryItem =
        this.state.bridgeStatusState.txHistory[txMetaId];

      const hexSourceChainId = decimalToPrefixedHex(
        bridgeHistoryItem.quote.srcChainId,
      );

      return (
        bridgeHistoryItem.account === address &&
        hexSourceChainId === selectedChainId
      );
    });

    sourceTxMetaIdsToDelete.forEach((sourceTxMetaId) => {
      const pollingToken = this.#pollingTokensByTxMetaId[sourceTxMetaId];

      if (pollingToken) {
        this.stopPollingByPollingToken(
          this.#pollingTokensByTxMetaId[sourceTxMetaId],
        );
      }
    });

    this.update((_state) => {
      _state.bridgeStatusState.txHistory = sourceTxMetaIdsToDelete.reduce(
        (acc, sourceTxMetaId) => {
          delete acc[sourceTxMetaId];
          return acc;
        },
        _state.bridgeStatusState.txHistory,
      );
    });
  };
}
