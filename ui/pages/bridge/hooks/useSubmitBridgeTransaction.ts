import { useDispatch, useSelector } from 'react-redux';
import { zeroAddress } from 'ethereumjs-util';
import { useHistory } from 'react-router-dom';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { createProjectLogger, Hex } from '@metamask/utils';
import type {
  QuoteMetadata,
  QuoteResponse,
} from '../../../../shared/types/bridge';
import {
  AWAITING_SIGNATURES_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import { setDefaultHomeActiveTabName } from '../../../store/actions';
import { startPollingForBridgeTxStatus } from '../../../ducks/bridge-status/actions';
import {
  getSelectedAddress,
  getMemoizedUnapprovedTemplatedConfirmations,
  getSelectedInternalAccount,
  isHardwareWallet,
} from '../../../selectors';
import { getQuoteRequest } from '../../../ducks/bridge/selectors';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { setWasTxDeclined } from '../../../ducks/bridge/actions';
import {
  getInitialHistoryItem,
  serializeQuoteMetadata,
} from '../../../../shared/lib/bridge-status/utils';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { useCrossChainSwapsEventTracker } from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { getCommonProperties } from '../../../../shared/lib/bridge-status/metrics';
import {
  MetricsBackgroundState,
  StatusTypes,
} from '../../../../shared/types/bridge-status';
import { getMultichainIsSolana } from '../../../selectors/multichain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import useAddToken from './useAddToken';
import useHandleApprovalTx, {
  APPROVAL_TX_ERROR,
  ALLOWANCE_RESET_ERROR,
} from './useHandleApprovalTx';
import useHandleBridgeTx from './useHandleBridgeTx';

const debugLog = createProjectLogger('bridge');
const LINEA_DELAY_MS = 5000;

export const isAllowanceResetError = (error: unknown): boolean => {
  const errorMessage = (error as Error).message ?? '';
  return errorMessage.includes(ALLOWANCE_RESET_ERROR);
};

export const isApprovalTxError = (error: unknown): boolean => {
  const errorMessage = (error as Error).message ?? '';
  return errorMessage.includes(APPROVAL_TX_ERROR);
};

const isHardwareWalletUserRejection = (error: unknown): boolean => {
  const errorMessage = (error as Error).message?.toLowerCase() ?? '';
  return (
    // Ledger rejection
    (errorMessage.includes('ledger') &&
      (errorMessage.includes('rejected') ||
        errorMessage.includes('denied') ||
        errorMessage.includes('error while signing'))) ||
    // Trezor rejection
    (errorMessage.includes('trezor') &&
      (errorMessage.includes('cancelled') ||
        errorMessage.includes('rejected'))) ||
    // Lattice rejection
    (errorMessage.includes('lattice') && errorMessage.includes('rejected')) ||
    // Generic hardware wallet rejections
    errorMessage.includes('user rejected') ||
    errorMessage.includes('user cancelled')
  );
};

export default function useSubmitBridgeTransaction() {
  const history = useHistory();
  const dispatch = useDispatch();
  const state = useSelector((allState) => allState);
  const srcChainId = useSelector(getCurrentChainId);
  const { addSourceToken, addDestToken } = useAddToken();
  const { handleApprovalTx } = useHandleApprovalTx();
  const { handleBridgeTx } = useHandleBridgeTx();
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const { slippage } = useSelector(getQuoteRequest);
  const selectedAddress = useSelector(getSelectedAddress);
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();

  const isSolana = useSelector(getMultichainIsSolana);
  const unapprovedTemplatedConfirmations = useSelector(
    getMemoizedUnapprovedTemplatedConfirmations,
  );
  const selectedAccount = useMultichainSelector(getSelectedInternalAccount);
  // Navigate to confirmation page on submit
  // We don't need this since only one approval is required
  /*
  useEffect(() => {
    const templatedSnapApproval = unapprovedTemplatedConfirmations.find(
      (approval) => {
        return (
          approval.type === 'snap_dialog' &&
          selectedAccount.metadata.snap &&
          selectedAccount.metadata.snap.id === approval.origin &&
          isMultichainWalletSnap(selectedAccount.metadata.snap.id)
        );
      },
    );

    if (templatedSnapApproval) {
      history.push(`${CONFIRMATION_V_NEXT_ROUTE}/${templatedSnapApproval.id}`);
    }
  }, [unapprovedTemplatedConfirmations, history, selectedAccount]);
  */

  const submitBridgeTransaction = async (
    quoteResponse: QuoteResponse & QuoteMetadata,
  ) => {
    if (isSolana) {
      console.log('=======submitting this trade', quoteResponse.trade);
      const bridgeTxResult = await handleBridgeTx({
        quoteResponse,
        approvalTxId: undefined,
      });

      const txSignature =
        'txSignature' in bridgeTxResult
          ? bridgeTxResult.txSignature
          : undefined;

      if (txSignature) {
        // Create a status request for Solana
        const statusRequestCommon = {
          bridgeId: quoteResponse.quote.bridgeId,
          bridge: quoteResponse.quote.bridges[0],
          srcChainId: quoteResponse.quote.srcChainId,
          destChainId: quoteResponse.quote.destChainId,
          quote: quoteResponse.quote,
          refuel: Boolean(quoteResponse.quote.refuel),
          srcTxHash: txSignature,
        };

        // Create a minimal transaction meta for Solana
        const bridgeTxMeta: TransactionMeta = {
          id: txSignature,
          hash: txSignature,
          time: Date.now(),
          status: TransactionStatus.submitted,
          chainId: `0x${quoteResponse.quote.srcChainId.toString(16)}` as Hex,
          networkClientId: srcChainId,
          txParams: {
            from: selectedAccount.id,
            to: '', // Solana doesn't use 'to' address in the same way
            value: '0x0',
            data: '', // We don't store the actual trade data as it's base64
            gas: '0x0',
          },
          origin: 'metamask',
          type: TransactionType.bridge,
        };

        // Start polling for bridge tx status
        dispatch(
          startPollingForBridgeTxStatus({
            bridgeTxMeta,
            statusRequest: statusRequestCommon,
            quoteResponse: serializeQuoteMetadata(quoteResponse),
            slippagePercentage: slippage ?? 0,
            startTime: bridgeTxMeta.time,
          }),
        );

        // Route user to activity tab
        await dispatch(setDefaultHomeActiveTabName('activity'));
        history.push({
          pathname: DEFAULT_ROUTE,
          state: { stayOnHomePage: true },
        });
      }
      return;
    }
    if (hardwareWalletUsed) {
      history.push(`${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`);
    }

    const statusRequestCommon = {
      bridgeId: quoteResponse.quote.bridgeId,
      bridge: quoteResponse.quote.bridges[0],
      srcChainId: quoteResponse.quote.srcChainId,
      destChainId: quoteResponse.quote.destChainId,
      quote: quoteResponse.quote,
      refuel: Boolean(quoteResponse.quote.refuel),
    };

    // Execute transaction(s)
    let approvalTxMeta: TransactionMeta | undefined;
    try {
      if (quoteResponse?.approval) {
        // This will never be an STX
        approvalTxMeta = await handleApprovalTx({
          approval: quoteResponse.approval,
          quoteResponse,
        });
      }
    } catch (e) {
      debugLog('Approve transaction failed', e);
      if (hardwareWalletUsed && isHardwareWalletUserRejection(e)) {
        dispatch(setWasTxDeclined(true));
        history.push(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      } else {
        await dispatch(setDefaultHomeActiveTabName('activity'));
        history.push(DEFAULT_ROUTE);
      }

      // Capture error in metrics
      const historyItem = getInitialHistoryItem({
        quoteResponse: serializeQuoteMetadata(quoteResponse),
        bridgeTxMetaId: 'dummy-id',
        startTime: approvalTxMeta?.time,
        slippagePercentage: slippage ?? 0,
        initialDestAssetBalance: undefined,
        targetContractAddress: undefined,
        account: selectedAddress,
        statusRequest: statusRequestCommon,
      });
      const commonProperties = getCommonProperties(
        historyItem,
        state as { metamask: MetricsBackgroundState },
      );

      // Get tx statuses
      const allowanceResetTransaction = isAllowanceResetError(e)
        ? { allowance_reset_transaction: StatusTypes.FAILED }
        : undefined;
      const approvalTransaction = isApprovalTxError(e)
        ? { approval_transaction: StatusTypes.FAILED }
        : undefined;

      trackCrossChainSwapsEvent({
        event: MetaMetricsEventName.ActionFailed,
        properties: {
          ...commonProperties,

          ...allowanceResetTransaction,
          ...approvalTransaction,

          error_message: (e as Error).message,
        },
      });

      return;
    }

    if (
      (
        [
          CHAIN_IDS.LINEA_MAINNET,
          CHAIN_IDS.LINEA_GOERLI,
          CHAIN_IDS.LINEA_SEPOLIA,
        ] as Hex[]
      ).includes(srcChainId) &&
      quoteResponse?.approval
    ) {
      debugLog(
        'Delaying submitting bridge tx to make Linea confirmation more likely',
      );
      const waitPromise = new Promise((resolve) =>
        setTimeout(resolve, LINEA_DELAY_MS),
      );
      await waitPromise;
    }

    let bridgeTxMeta: TransactionMeta | undefined;
    try {
      bridgeTxMeta = await handleBridgeTx({
        quoteResponse,
        approvalTxId: approvalTxMeta?.id,
      });
    } catch (e) {
      debugLog('Bridge transaction failed', e);
      if (hardwareWalletUsed && isHardwareWalletUserRejection(e)) {
        dispatch(setWasTxDeclined(true));
        history.push(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      } else {
        await dispatch(setDefaultHomeActiveTabName('activity'));
        history.push(DEFAULT_ROUTE);
      }
      return;
    }

    // Get bridge tx status
    const statusRequest = {
      ...statusRequestCommon,
      srcTxHash: bridgeTxMeta.hash, // This might be undefined for STX
    };
    dispatch(
      startPollingForBridgeTxStatus({
        bridgeTxMeta,
        statusRequest,
        quoteResponse: serializeQuoteMetadata(quoteResponse),
        slippagePercentage: slippage ?? 0,
        startTime: bridgeTxMeta.time,
      }),
    );

    // Add tokens if not the native gas token
    if (quoteResponse.quote.srcAsset.address !== zeroAddress()) {
      addSourceToken(quoteResponse);
    }
    if (quoteResponse.quote.destAsset.address !== zeroAddress()) {
      await addDestToken(quoteResponse);
    }

    // Route user to activity tab on Home page
    await dispatch(setDefaultHomeActiveTabName('activity'));
    history.push({
      pathname: DEFAULT_ROUTE,
      state: { stayOnHomePage: true },
    });
  };

  return {
    submitBridgeTransaction,
  };
}
