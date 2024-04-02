import * as i18n from '@/languages';
import React, { useCallback, useMemo } from 'react';
import { CoinRow } from '../CoinRow';
import { useSwapAssetStore } from '../../state/assets';
import { SearchAsset } from '../../types/search';
import { Box, Inline, Inset, Stack, Text } from '@/design-system';
import { TextStyle } from 'react-native';
import { AssetToBuySection, AssetToBuySectionId } from '../../hooks/useSearchCurrencyLists';
import { ChainId } from '../../types/chains';
import { TextColor } from '@/design-system/color/palettes';
import { useSwapContext } from '../../providers/swap-provider';
import Animated, { runOnUI } from 'react-native-reanimated';
import { parseSearchAsset, isSameAsset, isSameAssetWorklet } from '../../utils/assets';

import { useAssetsToSell } from '../../hooks/useAssetsToSell';
import { ListEmpty } from './ListEmpty';

interface SectionProp {
  color: TextStyle['color'];
  symbol: string;
  title: string;
}

const sectionProps: { [id in AssetToBuySectionId]: SectionProp } = {
  favorites: {
    title: i18n.t(i18n.l.token_search.section_header.favorites),
    symbol: '􀋃',
    color: 'rgba(255, 218, 36, 1)',
  },
  bridge: {
    title: i18n.t(i18n.l.token_search.section_header.bridge),
    symbol: '􀊝',
    color: 'label',
  },
  verified: {
    title: i18n.t(i18n.l.token_search.section_header.verified),
    symbol: '􀇻',
    color: 'rgba(38, 143, 255, 1)',
  },
  unverified: {
    title: i18n.t(i18n.l.token_search.section_header.unverified),
    symbol: '􀇿',
    color: 'background: rgba(255, 218, 36, 1)',
  },
  other_networks: {
    title: i18n.t(i18n.l.token_search.section_header.on_other_networks),
    symbol: 'network',
    color: 'labelTertiary',
  },
};

const bridgeSectionsColorsByChain = {
  [ChainId.mainnet]: 'mainnet' as TextStyle['color'],
  [ChainId.arbitrum]: 'arbitrum' as TextStyle['color'],
  [ChainId.optimism]: 'optimism' as TextStyle['color'],
  [ChainId.polygon]: 'polygon' as TextStyle['color'],
  [ChainId.base]: 'base' as TextStyle['color'],
  [ChainId.zora]: 'zora' as TextStyle['color'],
  [ChainId.bsc]: 'bsc' as TextStyle['color'],
  [ChainId.avalanche]: 'avalanche' as TextStyle['color'],
  [ChainId.blast]: 'blast' as TextStyle['color'],
};

export const TokenToBuySection = ({ section }: { section: AssetToBuySection }) => {
  const { SwapNavigation, SwapInputController } = useSwapContext();
  const { outputChainId } = useSwapAssetStore();
  const userAssets = useAssetsToSell();

  const handleSelectToken = useCallback(
    (token: SearchAsset) => {
      const userAsset = userAssets.find(asset => isSameAsset(asset, token));
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: token,
        userAsset,
      });

      runOnUI(() => {
        SwapInputController.assetToBuy.value = parsedAsset;
        if (SwapInputController.assetToSell.value && isSameAssetWorklet(SwapInputController.assetToSell.value, parsedAsset)) {
          SwapInputController.assetToSell.value = null;
          SwapNavigation.handleInputPress();
          SwapNavigation.handleExitSearch();
        } else {
          SwapNavigation.handleOutputPress();
          SwapNavigation.handleExitSearch();
        }
      })();
    },
    [SwapInputController, SwapNavigation, userAssets]
  );

  const { symbol, title } = sectionProps[section.id];

  const color = useMemo(() => {
    if (section.id !== 'bridge') {
      return sectionProps[section.id].color as TextColor;
    }
    return bridgeSectionsColorsByChain[outputChainId || ChainId.mainnet] as TextColor;
  }, [section.id, outputChainId]);

  if (!section.data.length) return null;

  return (
    <Box paddingHorizontal={'20px'} key={section.id} testID={`${section.id}-token-to-buy-section`}>
      <Stack space="20px">
        {section.id === 'other_networks' ? (
          <Box borderRadius={12} height={{ custom: 52 }}>
            <Inset horizontal="20px" vertical="8px">
              <Inline space="8px" alignVertical="center">
                {/* <SwapCoinIcon  /> */}
                <Text size="icon 14px" weight="semibold" color={'labelQuaternary'}>
                  {i18n.t(i18n.l.swap.tokens_input.nothing_found)}
                </Text>
              </Inline>
            </Inset>
          </Box>
        ) : null}
        <Inline space="6px" alignVertical="center">
          <Text size="14px / 19px (Deprecated)" weight="heavy" color={section.id === 'bridge' ? color : { custom: color }}>
            {symbol}
          </Text>
          <Text size="14px / 19px (Deprecated)" weight="heavy" color="label">
            {title}
          </Text>
        </Inline>

        <Animated.FlatList
          data={section.data}
          ListEmptyComponent={<ListEmpty />}
          renderItem={({ item }) => (
            <CoinRow
              key={item.uniqueId}
              chainId={item.chainId}
              color={item.colors?.primary ?? item.colors?.fallback}
              iconUrl={item.icon_url}
              address={item.address}
              mainnetAddress={item.mainnetAddress}
              balance={''}
              name={item.name}
              onPress={() => handleSelectToken(item)}
              nativeBalance={''}
              output={false}
              symbol={item.symbol}
            />
          )}
        />
      </Stack>
    </Box>
  );
};