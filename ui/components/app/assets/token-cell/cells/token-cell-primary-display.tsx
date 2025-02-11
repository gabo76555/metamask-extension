import React from 'react';
import {
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  SensitiveText,
  SensitiveTextLength,
} from '../../../../component-library';
import { TokenFiatDisplayInfo } from '../../types';

type TokenCellPrimaryDisplayProps = {
  token: TokenFiatDisplayInfo;
  privacyMode: boolean;
};

export const TokenCellPrimaryDisplay = ({
  token,
  privacyMode,
}: TokenCellPrimaryDisplayProps) => {
  // primary display text
  return (
    <SensitiveText
      data-testid="multichain-token-list-item-value"
      color={TextColor.textAlternative}
      variant={TextVariant.bodySmMedium}
      textAlign={TextAlign.End}
      isHidden={privacyMode}
      length={SensitiveTextLength.Short}
    >
      {token.primary} {token.symbol}
    </SensitiveText>
  );
};
