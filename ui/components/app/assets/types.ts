import { Hex } from '@metamask/utils';

export type Token = {
  address: Hex;
  aggregators?: string[];
  chainId: Hex;
  decimals: number;
  isNative?: boolean;
  symbol: string;
  image: string;
};

export type TokenDisplayInfo = {
  title: string;
  tokenImage: string;
  primary: string;
  secondary: string | undefined;
  isStakeable: boolean | undefined;
  tokenChainImage: string;
};

export type TokenWithFiatAmount = Token & {
  tokenFiatAmount?: number | null;
  balance?: string;
  string?: string; // needed for backwards compatability TODO: fix this
};

export type TokenFiatDisplayInfo = TokenWithFiatAmount &
  Partial<TokenDisplayInfo>;

export type AddressBalanceMapping = Record<Hex, Record<Hex, Hex>>;
export type ChainAddressMarketData = Record<
  Hex,
  Record<Hex, Record<string, string | number>>
>;

export type SymbolCurrencyRateMapping = Record<string, Record<string, number>>;
