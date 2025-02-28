import type { Hex } from '@metamask/utils';
import { createSelector } from 'reselect';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import type { MetaMaskReduxState } from '../../../store/store';
// eslint-disable-next-line import/no-restricted-paths
import { type SamplePetnamesControllerState } from '../../../../app/scripts/controllers/sample/sample-petnames-controller';

// Selectors
export const getSamplePetnamesByChainIdAndAddress = (
  state: MetaMaskReduxState,
) =>
  state.metamask.samplePetnamesByChainIdAndAddress as
    | SamplePetnamesControllerState['samplePetnamesByChainIdAndAddress']
    | undefined;

export const getPetNamesForCurrentChain = createSelector(
  [getSamplePetnamesByChainIdAndAddress, getCurrentChainId],
  (petnamesByChainIdAndAddress, chainId): Record<Hex, string> =>
    petnamesByChainIdAndAddress?.[chainId] ?? {},
);
