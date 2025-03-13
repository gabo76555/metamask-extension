import { Eip7702AuthorizationParams } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { createPublicClient, formatEther, http, parseEther } from 'viem';
import { sepolia } from 'viem/chains';
import { SEPOLIA_RPC_URL } from '../../../shared/constants/network';
import {
  Box,
  Button,
  ButtonVariant,
  Text,
} from '../../components/component-library';
import Spinner from '../../components/ui/spinner';
import {
  FontWeight,
  TextVariant,
  TextAlign,
  BackgroundColor,
  Display,
  JustifyContent,
  FlexDirection,
  BlockSize,
} from '../../helpers/constants/design-system';
import Card from '../../components/ui/card';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';

import { newSignEip7702Authorization, sign7702Auth } from '../../store/actions';

const RPC_URL = SEPOLIA_RPC_URL;

export default function DelegationUpgrade({
  accounts,
}: {
  accounts: InternalAccount[];
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const history = useHistory();

  // Get delegator (account 1) and delegate (account 2)
  const account1 = accounts[0];
  const account2 = accounts.length > 1 ? accounts[1] : null;

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
  });

  const signEip7702Authorization = async () => {
    setLoading(true);
    try {
      const params: Eip7702AuthorizationParams = {
        chainId: 0,
        contractAddress: '0x0837815B8ae45915f2f368Eb28578440175c033B',
        nonce: 0,
        from: account1.address,
      };
      console.log('Starting 7702 authorization');
      const signature = await sign7702Auth(params);
      console.log('Signature: ', signature);
    } catch (error) {
      console.error('Error signing EIP-7702 authorization:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
        padding={2}
        width={BlockSize.Full}
      >
        <Text
          textAlign={TextAlign.Center}
          variant={TextVariant.headingMd}
          fontWeight={FontWeight.Bold}
        >
          Account update request
        </Text>
        <Text textAlign={TextAlign.Center}>
          You&apos;re agreeing to update your account to a smart account to use
          detached mode.
        </Text>

        <Card backgroundColor={BackgroundColor.backgroundMuted}>
          <Box
            display={Display.Flex}
            gap={2}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text as="p" paddingBottom={2}>
              Account type
              {/* <Tag label="New" /> */}
            </Text>
            <Text as="p" paddingBottom={2}>
              Smart account
            </Text>
          </Box>
        </Card>

        <Card backgroundColor={BackgroundColor.backgroundMuted}>
          <Box
            display={Display.Flex}
            gap={2}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text as="p" paddingBottom={2}>
              Network fee
            </Text>
            <Text as="p" paddingBottom={2}>
              0.0013 ETH
            </Text>
          </Box>
          <Box
            paddingTop={2}
            display={Display.Flex}
            gap={2}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text as="p" paddingBottom={2}>
              Speed
            </Text>
            <Text as="p" paddingBottom={2}>
              Market &lt; 30 sec
            </Text>
          </Box>
        </Card>

        <Box
          paddingTop={2}
          display={Display.Flex}
          gap={2}
          justifyContent={JustifyContent.center}
        >
          <Button
            variant={ButtonVariant.Secondary}
            disabled={loading}
            width={BlockSize.Half}
            onClick={() => history.push(DEFAULT_ROUTE)}
          >
            Cancel
          </Button>
          <Button
            onClick={signEip7702Authorization}
            disabled={loading}
            width={BlockSize.Half}
          >
            Continue
          </Button>
        </Box>
        {loading && <Spinner />}
      </Box>
    </div>
  );
}
