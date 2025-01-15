import { providerErrors } from '@metamask/rpc-errors';
import {
  JustifyContent,
  SEVERITIES,
  TextColor,
  TypographyVariant,
} from '../../../../helpers/constants/design-system';

const ALERT_PENDING_CONFIRMATIONS = (count) => ({
  id: 'PENDING_TX_DROP_NOTICE',
  severity: SEVERITIES.WARNING,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey:
          count === 1
            ? 'switchingNetworksCancelsPendingConfirmationsSingular'
            : 'switchingNetworksCancelsPendingConfirmations',
        variables: [count],
      },
    },
  },
});

async function getAlerts(_pendingApproval, state) {
  return [ALERT_PENDING_CONFIRMATIONS(state.pendingApprovals.length - 1)];
}

function getValues(pendingApproval, t, actions) {
  return {
    content: [
      {
        element: 'Typography',
        key: 'title',
        children: t('switchEthereumChainConfirmationTitle'),
        props: {
          variant: TypographyVariant.H3,
          align: 'center',
          fontWeight: 'normal',
          boxProps: {
            margin: [0, 0, 2],
            padding: [0, 4, 0, 4],
          },
        },
      },
      {
        element: 'Typography',
        key: 'description',
        children: t('switchEthereumChainConfirmationDescription'),
        props: {
          variant: TypographyVariant.H7,
          color: TextColor.textAlternative,
          align: 'center',
          boxProps: {
            padding: [0, 4, 0, 4],
          },
        },
      },
      {
        element: 'OriginPill',
        key: 'origin-pill',
        props: {
          origin: pendingApproval.origin,
          dataTestId: 'signature-origin-pill',
        },
      },
      {
        element: 'Box',
        key: 'status-box',
        props: {
          justifyContent: JustifyContent.center,
        },
        children: {
          element: 'ConfirmationNetworkSwitch',
          key: 'network-being-switched',
          props: {
            toNetwork: pendingApproval.requestData.toNetworkConfiguration,
            fromNetwork: pendingApproval.requestData.fromNetworkConfiguration,
          },
        },
      },
    ],
    cancelText: t('cancel'),
    submitText: t('switchNetwork'),
    onSubmit: () =>
      actions.resolvePendingApproval(
        pendingApproval.id,
        pendingApproval.requestData.toNetworkConfiguration,
      ),

    onCancel: () =>
      actions.rejectPendingApproval(
        pendingApproval.id,
        providerErrors.userRejectedRequest().serialize(),
      ),
    networkDisplay: true,
  };
}

const switchEthereumChain = {
  getAlerts,
  getValues,
};

export default switchEthereumChain;
