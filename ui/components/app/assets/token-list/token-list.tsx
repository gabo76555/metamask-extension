import React, { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import TokenCell from '../token-cell';
import {
  getChainIdsToPoll,
  getCurrentNetwork,
  getNewTokensImported,
  getPreferences,
  getSelectedAccount,
  getTokenBalancesEvm,
} from '../../../../selectors';
import { endTrace, TraceName } from '../../../../../shared/lib/trace';
import { useTokenBalances as pollAndUpdateEvmBalances } from '../../../../hooks/useTokenBalances';
import { useNativeTokenBalance, useNetworkFilter } from '../hooks';
import { TokenWithFiatAmount } from '../types';
import { getMultichainIsEvm } from '../../../../selectors/multichain';
import { filterAssets } from '../util/filter';
import { sortAssets } from '../util/sort';
import { Box } from '../../../component-library';

type TokenListProps = {
  onTokenClick: (chainId: string, address: string) => void;
};

function TokenList({ onTokenClick }: TokenListProps) {
  const isEvm = useSelector(getMultichainIsEvm);
  const chainIdsToPoll = useSelector(getChainIdsToPoll);
  const newTokensImported = useSelector(getNewTokensImported);
  const evmBalances = useSelector(getTokenBalancesEvm); // TODO: This is where we need to select non evm-assets from state, when isEvm is false
  const currentNetwork = useSelector(getCurrentNetwork);
  const { tokenSortConfig, privacyMode } = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedAccount);

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
    const filteredAssets: TokenWithFiatAmount[] = filterAssets(balances, [
      {
        key: 'chainId',
        opts: isEvm ? networkFilter : { [nonEvmNativeToken.chainId]: true },
        filterCallback: 'inclusive',
      },
    ]);

    // sort filtered tokens based on the tokenSortConfig in state
    return sortAssets([...filteredAssets], tokenSortConfig);
  }, [
    tokenSortConfig,
    networkFilter,
    currentNetwork,
    selectedAccount,
    newTokensImported,
    evmBalances,
  ]);

  useEffect(() => {
    if (sortedFilteredTokens) {
      endTrace({ name: TraceName.AccountOverviewAssetListTab });
    }
  }, [sortedFilteredTokens]);

  const rootRef = useRef(
    document.getElementsByClassName('app').item(0) as HTMLDivElement,
  );
  const virtualizer = useVirtualizer({
    count: sortedFilteredTokens.length,
    estimateSize: () => 62,
    getScrollElement: () => rootRef.current,
  });
  const virtualTokens = virtualizer.getVirtualItems();

  return (
    <Box
      style={{
        minHeight: '80px',
      }}
      ref={rootRef}
    >
      <Box
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualTokens.map((virtualItem) => {
          const token = sortedFilteredTokens[virtualItem.index] ?? undefined;
          if (!token) {
            return null;
          }

          return (
            <Box
              key={`${token.chainId}-${token.symbol}-${token.address}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                minHeight: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <TokenCell
                token={token}
                privacyMode={privacyMode}
                onClick={onTokenClick}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default React.memo(TokenList);
