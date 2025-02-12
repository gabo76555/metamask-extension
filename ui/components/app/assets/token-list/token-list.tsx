import React, { useEffect, useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import TokenCell from '../token-cell';
import {
  getChainIdsToPoll,
  getCurrentNetwork,
  getNewTokensImported,
  getPreferences,
  getSelectedAccount,
  getTokenBalancesEvm,
  getTokenExchangeRates,
} from '../../../../selectors';
import { endTrace, TraceName } from '../../../../../shared/lib/trace';
import { useTokenBalances as pollAndUpdateEvmBalances } from '../../../../hooks/useTokenBalances';
import { useNativeTokenBalance, useNetworkFilter } from '../hooks';
import { TokenWithFiatAmount } from '../types';
import { getMultichainIsEvm } from '../../../../selectors/multichain';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { filterAssets } from '../util/filter';
import { sortAssets } from '../util/sort';

type TokenListProps = {
  onTokenClick: (chainId: string, address: string) => void;
};

export default function TokenList({ onTokenClick }: TokenListProps) {
  const isEvm = useSelector(getMultichainIsEvm);
  const chainIdsToPoll = useSelector(getChainIdsToPoll);
  const newTokensImported = useSelector(getNewTokensImported);
  const evmBalances = useSelector(getTokenBalancesEvm); // TODO: This is where we need to select non evm-assets from state, when isEvm is false
  const currentNetwork = useSelector(getCurrentNetwork);
  const { tokenSortConfig, privacyMode } = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  // EVM specific tokenBalance polling, updates state via polling loop per chainId
  pollAndUpdateEvmBalances({
    chainIds: chainIdsToPoll as Hex[],
  });

  const nonEvmNativeToken = useNativeTokenBalance();

  // network filter to determine which tokens to show in list
  // on EVM we want to filter based on network filter controls, on non-evm we only want tokens from that chain identifier
  const { networkFilter } = useNetworkFilter();

  const sortedFilteredTokens = useMemo(() => {
    const balances = isEvm ? evmBalances : [nonEvmNativeToken];
    const filteredAssets = filterAssets(balances, [
      {
        key: 'chainId',
        opts: isEvm ? networkFilter : { [nonEvmNativeToken.chainId]: true },
        filterCallback: 'inclusive',
      },
    ]);

    const { nativeTokens, nonNativeTokens } = filteredAssets.reduce<{
      nativeTokens: TokenWithFiatAmount[];
      nonNativeTokens: TokenWithFiatAmount[];
    }>(
      (acc, token) => {
        if (token.isNative) {
          acc.nativeTokens.push(token);
        } else {
          acc.nonNativeTokens.push(token);
        }
        return acc;
      },
      { nativeTokens: [], nonNativeTokens: [] },
    );

    const assets = [...nativeTokens, ...nonNativeTokens];

    // sort filtered tokens based on the tokenSortConfig in state
    return sortAssets(assets, tokenSortConfig);
  }, [
    tokenSortConfig,
    networkFilter,
    conversionRate,
    contractExchangeRates,
    currentNetwork,
    selectedAccount,
    newTokensImported,
  ]);

  useEffect(() => {
    if (sortedFilteredTokens) {
      endTrace({ name: TraceName.AccountOverviewAssetListTab });
    }
  }, [sortedFilteredTokens]);

  return (
    <div>
      {sortedFilteredTokens.map((token: TokenWithFiatAmount) => (
        <TokenCell
          key={`${token.chainId}-${token.symbol}-${token.address}`}
          token={token}
          privacyMode={privacyMode}
          onClick={onTokenClick}
        />
      ))}
    </div>
  );
}
