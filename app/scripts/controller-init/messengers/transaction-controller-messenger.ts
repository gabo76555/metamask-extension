import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerGetStateAction, // FIXME: this is from https://github.com/MetaMask/metamask-extension/pull/30271/files#diff-eb756059bd2cb349825faa3880f3ec5ed26bd7a72bef432a29c64ae4da1c0d9e
} from '@metamask/accounts-controller';
import { ApprovalControllerActions } from '@metamask/approval-controller';
import { Messenger } from '@metamask/base-controller';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetEIP1559CompatibilityAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import {
  TransactionControllerMessenger,
  TransactionControllerPostTransactionBalanceUpdatedEvent,
  TransactionControllerTransactionApprovedEvent,
  TransactionControllerTransactionConfirmedEvent,
  TransactionControllerTransactionDroppedEvent,
  TransactionControllerTransactionFailedEvent,
  TransactionControllerTransactionNewSwapApprovalEvent,
  TransactionControllerTransactionNewSwapEvent,
  TransactionControllerTransactionRejectedEvent,
  TransactionControllerTransactionSubmittedEvent,
  TransactionControllerUnapprovedTransactionAddedEvent,
} from '@metamask/transaction-controller';
import { SmartTransactionsControllerSmartTransactionEvent } from '@metamask/smart-transactions-controller';

import {
  SwapsControllerSetApproveTxIdAction,
  SwapsControllerSetTradeTxIdAction,
} from '../../controllers/swaps/swaps.types';
import {
  InstitutionalSnapControllerPublishHookAction,
  InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction,
} from './accounts/institutional-snap-controller-messenger';

type MessengerActions =
  | ApprovalControllerActions
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerGetStateAction // FIXME: this is from https://github.com/MetaMask/metamask-extension/pull/30271/files#diff-eb756059bd2cb349825faa3880f3ec5ed26bd7a72bef432a29c64ae4da1c0d9e
  | InstitutionalSnapControllerPublishHookAction
  | InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetEIP1559CompatibilityAction
  | NetworkControllerGetNetworkClientByIdAction
  | SwapsControllerSetApproveTxIdAction
  | SwapsControllerSetTradeTxIdAction;

type MessengerEvents =
  | TransactionControllerTransactionApprovedEvent
  | TransactionControllerTransactionConfirmedEvent
  | TransactionControllerTransactionDroppedEvent
  | TransactionControllerTransactionFailedEvent
  | TransactionControllerTransactionNewSwapApprovalEvent
  | TransactionControllerTransactionNewSwapEvent
  | TransactionControllerTransactionRejectedEvent
  | TransactionControllerTransactionSubmittedEvent
  | TransactionControllerPostTransactionBalanceUpdatedEvent
  | TransactionControllerUnapprovedTransactionAddedEvent
  | NetworkControllerStateChangeEvent
  | SmartTransactionsControllerSmartTransactionEvent;

export type TransactionControllerInitMessenger = ReturnType<
  typeof getTransactionControllerInitMessenger
>;

export function getTransactionControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
): TransactionControllerMessenger {
  // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
  return messenger.getRestricted({
    name: 'TransactionController',
    allowedActions: [
      'AccountsController:getState', // FIXME: this is from https://github.com/MetaMask/metamask-extension/pull/30271/files#diff-eb756059bd2cb349825faa3880f3ec5ed26bd7a72bef432a29c64ae4da1c0d9e
      // allows me to use newer transaction controller
      'AccountsController:getSelectedAccount',
      `ApprovalController:addRequest`,
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
    ],
    allowedEvents: [`NetworkController:stateChange`],
  });
}

export function getTransactionControllerInitMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
) {
  return messenger.getRestricted({
    name: 'TransactionControllerInit',
    allowedEvents: [
      'TransactionController:transactionApproved',
      'TransactionController:transactionConfirmed',
      'TransactionController:transactionDropped',
      'TransactionController:transactionFailed',
      'TransactionController:transactionNewSwapApproval',
      'TransactionController:transactionNewSwap',
      'TransactionController:transactionRejected',
      'TransactionController:transactionSubmitted',
      'TransactionController:postTransactionBalanceUpdated',
      'TransactionController:unapprovedTransactionAdded',
      'SmartTransactionsController:smartTransaction',
    ],
    allowedActions: [
      'ApprovalController:addRequest',
      'ApprovalController:endFlow',
      'ApprovalController:startFlow',
      'ApprovalController:updateRequestState',
      'InstitutionalSnapController:publishHook',
      'InstitutionalSnapController:beforeCheckPendingTransactionHook',
      'NetworkController:getEIP1559Compatibility',
      'SwapsController:setApproveTxId',
      'SwapsController:setTradeTxId',
    ],
  });
}
