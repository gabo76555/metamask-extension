import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { KeyringMetadata, KeyringObject } from '@metamask/keyring-controller';
import Card from '../../../ui/card';
import {
  Box,
  IconName,
  Icon,
  Text,
  IconSize,
  AvatarAccount,
  AvatarAccountSize,
} from '../../../component-library';
import {
  JustifyContent,
  Display,
  TextColor,
  FlexDirection,
  AlignItems,
  BlockSize,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  getMetaMaskAccounts,
  getMetaMaskHdKeyrings,
} from '../../../../selectors/selectors';
import UserPreferencedCurrencyDisplay from '../../../app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import { shortenAddress } from '../../../../helpers/utils/util';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import { getMultichainConversionRate } from '../../../../selectors/multichain';
import { InternalAccountWithBalance } from '../../../../selectors/selectors.types';

type KeyringObjectWithMetadata = KeyringObject & { metadata: KeyringMetadata };

export const SRPList = ({
  onActionComplete,
  hideShowAccounts,
}: {
  onActionComplete: (id: string) => void;
  hideShowAccounts?: boolean;
}) => {
  const hdKeyrings: KeyringObjectWithMetadata[] = useSelector(
    getMetaMaskHdKeyrings,
  );
  // This selector will return accounts with nonEVM balances as well.
  const accountsWithBalances: Record<string, InternalAccountWithBalance> =
    useSelector(getMetaMaskAccounts);

  const conversionRate = useMultichainSelector(getMultichainConversionRate);

  const showAccountsInitState = useMemo(
    () =>
      hdKeyrings.reduce(
        (acc: Record<string, boolean>, _, index) => ({
          ...acc,
          [index]: Boolean(hideShowAccounts), // if hideShowAccounts is true, show all accounts by default
        }),
        {},
      ),
    [hdKeyrings],
  );

  const [showAccounts, setShowAccounts] = useState<Record<string, boolean>>(
    showAccountsInitState,
  );

  return (
    <Box padding={4} data-testid="srp-list">
      {hdKeyrings.map((keyring, index) => (
        <Card
          key={`srp-${index + 1}`}
          data-testid={`hd-keyring-${keyring.metadata.id}`}
          onClick={() => onActionComplete(keyring.metadata.id)}
          className="select-srp__container"
          marginBottom={3}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
            paddingLeft={4}
          >
            <Box>
              <Text>{`Secret Phrase ${index + 1}`}</Text>
              {!hideShowAccounts && (
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.primaryDefault}
                  className="srp-list__show-accounts"
                  onClick={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    setShowAccounts({
                      ...showAccounts,
                      [index]: !showAccounts[index],
                    });
                  }}
                >
                  {showAccounts[index] ? 'Hide' : 'Show'}{' '}
                  {keyring.accounts.length} account
                  {keyring.accounts.length > 1 ? 's' : ''}
                </Text>
              )}
            </Box>
            <Icon name={IconName.ArrowRight} size={IconSize.Sm} />
          </Box>
          {showAccounts[index] && (
            <Box>
              <Box
                width={BlockSize.Full}
                className="srp-list__divider"
                marginTop={2}
                marginBottom={2}
              />
              {keyring.accounts.map((address: string) => {
                const account = accountsWithBalances[address];
                return (
                  <Box
                    key={address}
                    display={Display.Flex}
                    flexDirection={FlexDirection.Row}
                    alignItems={AlignItems.center}
                    justifyContent={JustifyContent.spaceBetween}
                  >
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Row}
                      alignItems={AlignItems.center}
                    >
                      <AvatarAccount
                        address={address}
                        size={AvatarAccountSize.Xs}
                      />
                      <Text
                        className="srp-list__account-name"
                        variant={TextVariant.bodySm}
                        paddingLeft={3}
                      >
                        {account.metadata.name}
                      </Text>
                      <Text
                        variant={TextVariant.bodySm}
                        color={TextColor.textAlternative}
                        marginLeft={1}
                      >
                        {shortenAddress(address)}
                      </Text>
                    </Box>
                    <Text variant={TextVariant.bodySm}>
                      <UserPreferencedCurrencyDisplay
                        account={account}
                        value={account.balance}
                        type="PRIMARY"
                        ethNumberOfDecimals={4}
                        hideTitle
                        showFiat
                        isAggregatedFiatOverviewBalance
                        hideLabel
                      />
                    </Text>
                  </Box>
                );
              })}
            </Box>
          )}
        </Card>
      ))}
    </Box>
  );
};
