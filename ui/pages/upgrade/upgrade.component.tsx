import { Eip7702AuthorizationParams } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import React, { useCallback, useEffect, useState } from 'react';
import { createPublicClient, formatEther, http, parseEther } from 'viem';
import { sepolia } from 'viem/chains';
import { SEPOLIA_RPC_URL } from '../../../shared/constants/network';
import { Box, Button, Text } from '../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  TextColor,
} from '../../helpers/constants/design-system';
import { newSignEip7702Authorization, sign7702Auth } from '../../store/actions';

const RPC_URL = SEPOLIA_RPC_URL;

export default function DelegationUpgrade({
  accounts,
}: {
  accounts: InternalAccount[];
}) {
  const [loading, setLoading] = useState<boolean>(false);

  // Get delegator (account 1) and delegate (account 2)
  const account1 = accounts[0];
  const account2 = accounts.length > 1 ? accounts[1] : null;

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
  });

  const signEip7702Authorization = async () => {
    // setLoading(true);
    try {

      const params: Eip7702AuthorizationParams = {
        chainId: 0,
        contractAddress: "0x0837815B8ae45915f2f368Eb28578440175c033B",
        nonce: 0,
        from: account1.address,
      }
      console.log('Starting 7702 authorization');
      const signature = await newSignEip7702Authorization(params);
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
        paddingTop={2}
        width={BlockSize.Full}
      >
        <Text as="h2">Upgrade HW Wallet</Text>

        <Button
          onClick={signEip7702Authorization}
          disabled={loading}
        >
          Sign 7702 Authorization
        </Button>
      </Box>
    </div>
  );
}
