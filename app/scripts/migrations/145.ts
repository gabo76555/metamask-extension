import { hasProperty } from '@metamask/utils';
import { cloneDeep, isObject } from 'lodash';
import { PRICE_API_CURRENCIES } from '../../../shared/constants/price-api-currencies';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

type CurrencyController = {
  currentCurrency?: string;
};

export const version = 144;
const DEFAULT_CURRENCY = 'usd';

/**
 * This migration ensures that all Infura RPC endpoints use Quicknode as a
 * failover.
 *
 * @param originalVersionedData - The original MetaMask extension state.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (!hasProperty(state, 'NetworkController')) {
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: Missing CurrencyController in state`),
    );
    return;
  }

  const currencyController = state.CurrencyController as CurrencyController;

  if (!isObject(currencyController)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Invalid CurrencyController state type '${typeof currencyController}'`,
      ),
    );
    return;
  }

  const { currentCurrency } = currencyController;

  if (!currentCurrency) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Missing currentCurrency in CurrencyController, defaulting to ${DEFAULT_CURRENCY}`,
      ),
    );
    currencyController.currentCurrency = DEFAULT_CURRENCY;
    return;
  }

  const isValidCurrency = PRICE_API_CURRENCIES.some(
    (currency) => currency === currentCurrency,
  );

  if (!isValidCurrency) {
    currencyController.currentCurrency = DEFAULT_CURRENCY;
  }
}
