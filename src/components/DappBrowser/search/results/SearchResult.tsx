import React, { useCallback } from 'react';
import { ImgixImage } from '@/components/images';
import { AnimatedText, Box, Inline, Stack, Text, useForegroundColor } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import GoogleSearchIcon from '@/assets/googleSearchIcon.png';
import { Source } from 'react-native-fast-image';
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { FasterImageView, ImageOptions } from '@candlefinance/faster-image';
import { Dapp } from '@/resources/metadata/dapps';
import { useSearchContext } from '../SearchContext';
import { useDimensions } from '@/hooks';

const AnimatedFasterImage = Animated.createAnimatedComponent(FasterImageView);

export const SearchResult = ({ index, navigateToUrl }: { index: number; navigateToUrl: (url: string) => void }) => {
  const { searchResults } = useSearchContext();
  const { width: deviceWidth } = useDimensions();

  const dapp: SharedValue<Dapp | undefined> = useDerivedValue(() => searchResults?.value[index]);
  const name: SharedValue<string | undefined> = useDerivedValue(() => dapp.value?.name);
  const url: SharedValue<string | undefined> = useDerivedValue(() => dapp.value?.url);
  const urlDisplay: SharedValue<string | undefined> = useDerivedValue(() => dapp.value?.urlDisplay);
  const iconImageOpts: SharedValue<ImageOptions> = useDerivedValue(() => ({ url: dapp.value?.iconUrl ?? '', borderRadius: 10 }));

  const animatedStyle = useAnimatedStyle(() => {
    return {
      display: dapp.value ? 'flex' : 'none',
    };
  });

  const separatorSecondary = useForegroundColor('separatorSecondary');

  const onPress = useCallback(() => url.value && navigateToUrl(url.value), [navigateToUrl, url.value]);

  return (
    <Animated.View style={animatedStyle}>
      <Box
        as={ButtonPressAnimation}
        padding="8px"
        borderRadius={18}
        background={index === 0 ? 'fill' : undefined}
        scaleTo={0.95}
        onPress={onPress}
        style={index === 0 ? { borderWidth: 1, borderColor: separatorSecondary } : {}}
      >
        <Inline space="12px" alignVertical="center" wrap={false}>
          <Box background="surfacePrimary" shadow="24px" width={{ custom: 40 }} height={{ custom: 40 }} style={{ borderRadius: 10 }}>
            <AnimatedFasterImage source={iconImageOpts} style={{ width: '100%', height: '100%' }} />
          </Box>
          <Box width={{ custom: deviceWidth - 100 }}>
            <Stack space="10px">
              <AnimatedText size="17pt" weight="bold" color="label" numberOfLines={1}>
                {name}
              </AnimatedText>
              <AnimatedText size="13pt" weight="bold" color="labelTertiary" numberOfLines={1}>
                {urlDisplay}
              </AnimatedText>
            </Stack>
          </Box>
        </Inline>
      </Box>
    </Animated.View>
  );
};

export const GoogleSearchResult = ({ navigateToUrl }: { navigateToUrl: (url: string) => void }) => {
  const { searchQuery } = useSearchContext();
  const { width: deviceWidth } = useDimensions();

  const animatedText = useDerivedValue(() => `Search "${searchQuery?.value}"`);

  const onPress = useCallback(
    () => searchQuery && navigateToUrl(`https://www.google.com/search?q=${encodeURIComponent(searchQuery.value)}`),
    [navigateToUrl, searchQuery]
  );

  return (
    <Box as={ButtonPressAnimation} padding="8px" borderRadius={18} scaleTo={0.95} onPress={onPress}>
      <Inline space="12px" alignVertical="center" wrap={false}>
        <Box
          alignItems="center"
          justifyContent="center"
          background="surfacePrimaryElevated"
          shadow="24px"
          width={{ custom: 40 }}
          height={{ custom: 40 }}
          borderRadius={10}
        >
          <ImgixImage source={GoogleSearchIcon as Source} style={{ width: 30, height: 30 }} size={30} />
        </Box>
        <Box width={{ custom: deviceWidth - 100 }}>
          <Stack space="10px">
            <AnimatedText size="17pt" weight="bold" color="label" numberOfLines={1}>
              {animatedText}
            </AnimatedText>
            <Text size="13pt" weight="bold" color="labelTertiary">
              Google
            </Text>
          </Stack>
        </Box>
      </Inline>
    </Box>
  );
};