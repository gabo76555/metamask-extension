import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { sortAssets } from '../util/sort';
import { filterAssets } from '../util/filter';
import {
  getCurrentNetwork,
  getNewTokensImported,
  getPreferences,
  getSelectedAccount,
  getTokenBalancesEvm,
  getTokenExchangeRates,
} from '../../../../selectors';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { TokenWithFiatAmount } from '../types';
import { useNativeTokenBalance } from '../asset-list/native-token/use-native-token-balance';
import { getMultichainIsEvm } from '../../../../selectors/multichain';
import useNetworkFilter from './useNetworkFilter';

const useSortedFilteredTokens = () => {
  const isEvm = useSelector(getMultichainIsEvm);
  const currentNetwork = useSelector(getCurrentNetwork);
  const { tokenSortConfig } = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const newTokensImported = useSelector(getNewTokensImported);
  const evmBalances = useSelector(getTokenBalancesEvm); // TODO: Make this chain agnostic
  const nonEvmNativeToken = useNativeTokenBalance();

  // network filter to determine which tokens to show in list
  const { networkFilter } = useNetworkFilter();

  return useMemo(() => {
    const balances = isEvm ? evmBalances : [nonEvmNativeToken];
    console.log('BALANCES: ', balances);
    // const filteredAssets = filterAssets(balances, [
    //   {
    //     key: 'chainId',
    //     opts: networkFilter,
    //     filterCallback: 'inclusive',
    //   },
    // ]);
    const filteredAssets = balances;

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
    console.log('ASSETS: ', assets);
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
};

export default useSortedFilteredTokens;
