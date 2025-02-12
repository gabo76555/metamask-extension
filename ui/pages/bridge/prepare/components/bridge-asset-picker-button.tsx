import React from 'react';
import {
  SelectButtonProps,
  SelectButtonSize,
} from '../../../../components/component-library/select-button/select-button.types';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  IconName,
  SelectButton,
  Text,
} from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  OverflowWrap,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { AssetPicker } from '../../../../components/multichain/asset-picker-amount/asset-picker';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../../../shared/constants/multichain/networks';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';

export const BridgeAssetPickerButton = ({
  asset,
  networkProps,
  ...props
}: SelectButtonProps<'div'> &
  Pick<React.ComponentProps<typeof AssetPicker>, 'asset' | 'networkProps'>) => {
  const t = useI18nContext();

  return (
    <SelectButton
      borderRadius={BorderRadius.pill}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderColor={BorderColor.borderMuted}
      style={{
        padding: 8,
        paddingRight: 11,
        paddingInline: asset ? undefined : 24,
        minWidth: 'fit-content',
      }}
      gap={0}
      size={SelectButtonSize.Lg}
      alignItems={AlignItems.center}
      descriptionProps={{
        variant: TextVariant.bodyMd,
        overflowWrap: OverflowWrap.BreakWord,
        ellipsis: false,
      }}
      caretIconProps={{
        name: IconName.Arrow2Down,
        style: { display: Display.None },
      }}
      label={
        <Text variant={TextVariant.bodyLgMedium} ellipsis>
          {asset?.symbol ?? t('bridgeTo')}
        </Text>
      }
      startAccessory={
        asset ? (
          <BadgeWrapper
            marginRight={2}
            badge={
              asset && networkProps?.network?.name ? (
                <AvatarNetwork
                  name={networkProps.network.name}
                  src={
                    networkProps.network?.chainId &&
                    {
                      ...CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
                      ...MULTICHAIN_TOKEN_IMAGE_MAP,
                    }[
                      networkProps.network
                        .chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
                    ]
                  }
                  size={AvatarNetworkSize.Xs}
                />
              ) : undefined
            }
          >
            {asset ? (
              <AvatarToken
                src={asset.image || undefined}
                backgroundColor={BackgroundColor.backgroundHover}
                name={asset.symbol}
              />
            ) : undefined}
          </BadgeWrapper>
        ) : undefined
      }
      {...props}
    />
  );
};
