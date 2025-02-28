import { isEvmAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { getAlertEnabledness } from '../../../ducks/metamask/metamask';
import { PRIVACY_POLICY_DATE } from '../../../helpers/constants/privacy-policy';
import {
  SURVEY_DATE,
  SURVEY_END_TIME,
  SURVEY_START_TIME,
} from '../../../helpers/constants/survey';
import { getPermittedAccountsForCurrentTab } from '../../../selectors';
import { MetaMaskReduxState } from '../../../store/store';
import { getIsPrivacyToastRecent } from './utils';

// TODO: get this into one of the larger definitions of state type
// type State = Omit<MetaMaskReduxState, 'appState'> & {
//   appState: {
//     showNftDetectionEnablementToast?: boolean;
//   };
//   metamask: {
//     newPrivacyPolicyToastClickedOrClosed?: boolean;
//     newPrivacyPolicyToastShownDate?: number;
//     onboardingDate?: number;
//     showNftDetectionEnablementToast?: boolean;
//     surveyLinkLastClickedOrClosed?: number;
//     switchedNetworkNeverShowMessage?: boolean;
//   };
// };

/**
 * Determines if the survey toast should be shown based on the current time, survey start and end times, and whether the survey link was last clicked or closed.
 *
 * @param state - The application state containing the necessary survey data.
 * @returns True if the current time is between the survey start and end times and the survey link was not last clicked or closed. False otherwise.
 */
export function selectShowSurveyToast(state: MetaMaskReduxState): boolean {
  if (state.metamask?.surveyLinkLastClickedOrClosed) {
    return false;
  }

  const startTime = new Date(`${SURVEY_DATE} ${SURVEY_START_TIME}`).getTime();
  const endTime = new Date(`${SURVEY_DATE} ${SURVEY_END_TIME}`).getTime();
  const now = Date.now();

  return now > startTime && now < endTime;
}

/**
 * Determines if the privacy policy toast should be shown based on the current date and whether the new privacy policy toast was clicked or closed.
 *
 * @param state - The application state containing the privacy policy data.
 * @returns Boolean is True if the toast should be shown, and the number is the date the toast was last shown.
 */
export function selectShowPrivacyPolicyToast(state: MetaMaskReduxState): {
  showPrivacyPolicyToast: boolean;
  newPrivacyPolicyToastShownDate?: number | null;
} {
  const {
    newPrivacyPolicyToastClickedOrClosed,
    newPrivacyPolicyToastShownDate,
    onboardingDate,
  } = state.metamask || {};
  const newPrivacyPolicyDate = new Date(PRIVACY_POLICY_DATE);
  const currentDate = new Date(Date.now());

  const showPrivacyPolicyToast =
    !newPrivacyPolicyToastClickedOrClosed &&
    currentDate >= newPrivacyPolicyDate &&
    getIsPrivacyToastRecent(newPrivacyPolicyToastShownDate) &&
    // users who onboarded before the privacy policy date should see the notice
    // and
    // old users who don't have onboardingDate set should see the notice
    (!onboardingDate || onboardingDate < newPrivacyPolicyDate.valueOf());

  return { showPrivacyPolicyToast, newPrivacyPolicyToastShownDate };
}

export function selectNftDetectionEnablementToast(
  state: MetaMaskReduxState,
): boolean {
  return Boolean(state.appState?.showNftDetectionEnablementToast);
}

// If there is more than one connected account to activeTabOrigin,
// *BUT* the current account is not one of them, show the banner
export function selectShowConnectAccountToast(
  state: MetaMaskReduxState,
  account: InternalAccount,
): boolean {
  const allowShowAccountSetting = getAlertEnabledness(state).unconnectedAccount;
  const connectedAccounts = getPermittedAccountsForCurrentTab(state);
  const isEvmAccount = isEvmAccountType(account?.type);

  return Boolean(
    allowShowAccountSetting &&
      account &&
      state.activeTab?.origin &&
      isEvmAccount &&
      connectedAccounts.length > 0 &&
      !connectedAccounts.some((address) => address === account.address),
  );
}

/**
 * Retrieves user preference to never see the "Switched Network" toast
 *
 * @param state - Redux state object.
 * @returns Boolean preference value
 */
export function selectSwitchedNetworkNeverShowMessage(
  state: MetaMaskReduxState,
): boolean {
  return Boolean(state.metamask.switchedNetworkNeverShowMessage);
}
