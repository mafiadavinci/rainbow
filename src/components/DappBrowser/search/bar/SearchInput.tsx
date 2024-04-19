import React, { useCallback, useMemo } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { AnimatedText, Box, Cover, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import Animated, {
  SharedValue,
  dispatchCommand,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Input from '@/components/inputs/Input';
import * as i18n from '@/languages';
import { NativeSyntheticEvent, StyleSheet, TextInputChangeEventData, TextInputSubmitEditingEventData } from 'react-native';
import { ToolbarIcon } from '../../ToolbarIcon';
import { IS_IOS } from '@/env';
import { FadeMask } from '@/__swaps__/screens/Swap/components/FadeMask';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { BrowserButtonShadows } from '../../DappBrowserShadows';
import { GestureHandlerV1Button } from '@/__swaps__/screens/Swap/components/GestureHandlerV1Button';
import font from '@/styles/fonts';
import { fontWithWidth } from '@/styles';
import { useBrowserContext } from '../../BrowserContext';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedBlurView } from '@/__swaps__/screens/Swap/components/AnimatedBlurView';
import haptics from '@/utils/haptics';
import { useFavoriteDappsStore } from '@/state/favoriteDapps';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { formatUrl, getNameFromFormattedUrl, handleShareUrl, isValidURL } from '../../utils';
import { GOOGLE_SEARCH_URL, HTTP, HTTPS, RAINBOW_HOME } from '../../constants';
import { useSearchContext } from '../SearchContext';
import { TabState } from '../../types';
import { Site } from '@/state/browserHistory';

const AnimatedInput = Animated.createAnimatedComponent(Input);
const AnimatedGestureHandlerV1Button = Animated.createAnimatedComponent(GestureHandlerV1Button);
// const AnimatedFadeMask = Animated.createAnimatedComponent(FadeMask);

export const SearchInput = ({
  activeTabIndex,
  animatedActiveTabIndex,
  tabViewProgress,
  tabStates,
  updateActiveTabState,
}: {
  activeTabIndex: number;
  animatedActiveTabIndex: SharedValue<number> | undefined;
  tabViewProgress: SharedValue<number> | undefined;
  tabStates: TabState[];
  updateActiveTabState: (newState: Partial<TabState>, tabId?: string | undefined) => void;
}) => {
  const { searchViewProgress } = useBrowserContext();
  const { inputRef, isFocused, searchQuery, searchResults } = useSearchContext();
  const { isFavorite, addFavorite, removeFavorite } = useFavoriteDappsStore();
  const { isDarkMode } = useColorMode();
  const { goBack, goForward, onRefresh } = useBrowserContext();

  const fillSecondary = useForegroundColor('fillSecondary');
  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const activeTab = tabStates?.[activeTabIndex];
  const tabId = activeTab?.uniqueId;
  const url = activeTab?.url;
  const logoUrl = activeTab?.logoUrl;
  const isHome = url === RAINBOW_HOME;
  const isGoogleSearch = url?.startsWith(GOOGLE_SEARCH_URL);
  const canGoBack = activeTab?.canGoBack;
  const canGoForward = activeTab?.canGoForward;

  const buttonColorIOS = isDarkMode ? fillSecondary : opacity(globalColors.white100, 0.9);
  const buttonColorAndroid = isDarkMode ? globalColors.blueGrey100 : globalColors.white100;
  const buttonColor = IS_IOS ? buttonColorIOS : buttonColorAndroid;

  const formattedInputValue = useMemo(() => {
    if (isHome) {
      return { url: i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder), tabIndex: activeTabIndex };
    }
    return { url: formatUrl(url), tabIndex: activeTabIndex };
  }, [activeTabIndex, isHome, url]);

  const urlWithoutTrailingSlash = url?.endsWith('/') ? url.slice(0, -1) : url;
  // eslint-disable-next-line no-nested-ternary
  const inputValue = isHome ? undefined : isGoogleSearch ? formattedInputValue.url : urlWithoutTrailingSlash;

  const formattedUrl = formattedInputValue?.url;
  const formattedUrlValue = useDerivedValue(() => {
    return formattedInputValue?.tabIndex !== animatedActiveTabIndex?.value ? '' : formattedInputValue?.url;
  });

  const pointerEventsStyle = useAnimatedStyle(() => ({
    pointerEvents: (tabViewProgress?.value || 0) / 100 < 1 ? 'auto' : 'none',
  }));

  const buttonWrapperStyle = useAnimatedStyle(() => ({
    pointerEvents: isFocused?.value ? 'auto' : 'box-only',
  }));

  const inputStyle = useAnimatedStyle(() => ({
    opacity: isFocused?.value ? withSpring(1, SPRING_CONFIGS.keyboardConfig) : withTiming(0, TIMING_CONFIGS.fadeConfig),
    pointerEvents: isFocused?.value ? 'auto' : 'none',
  }));

  const formattedInputStyle = useAnimatedStyle(() => ({
    opacity: isFocused?.value ? withTiming(0, TIMING_CONFIGS.fadeConfig) : withSpring(1, SPRING_CONFIGS.keyboardConfig),
  }));

  const hideFormattedUrlWhenTabChanges = useAnimatedStyle(() => ({
    opacity: withSpring(formattedInputValue?.tabIndex !== animatedActiveTabIndex?.value ? 0 : 1, SPRING_CONFIGS.snappierSpringConfig),
  }));

  const toolbarIconStyle = useAnimatedStyle(() => ({
    opacity:
      isHome || isFocused?.value || !formattedUrlValue.value
        ? withTiming(0, TIMING_CONFIGS.fadeConfig)
        : withSpring(1, SPRING_CONFIGS.keyboardConfig),
    pointerEvents: isHome || isFocused?.value || !formattedUrlValue.value ? 'none' : 'auto',
  }));

  const handleFavoritePress = useCallback(() => {
    if (inputValue) {
      if (isFavorite(inputValue)) {
        removeFavorite(inputValue);
      } else {
        const site: Omit<Site, 'timestamp'> = {
          name: getNameFromFormattedUrl(formattedUrl),
          url: inputValue,
          image: logoUrl || `https://${formattedUrl}/apple-touch-icon.png`,
        };
        addFavorite(site);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedUrl, inputValue, logoUrl]);

  const menuConfig = useMemo(
    () => ({
      menuTitle: '',
      menuItems: [
        {
          actionKey: 'share',
          actionTitle: 'Share',
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'square.and.arrow.up',
          },
        },
        !isGoogleSearch
          ? {
              actionKey: 'favorite',
              actionTitle: isFavorite(formattedUrl) ? 'Undo Favorite' : 'Favorite',
              icon: {
                iconType: 'SYSTEM',
                iconValue: isFavorite(formattedUrl) ? 'star.slash' : 'star',
              },
            }
          : {},
        canGoForward
          ? {
              actionKey: 'forward',
              actionTitle: 'Forward',
              icon: {
                iconType: 'SYSTEM',
                iconValue: 'arrowshape.forward',
              },
            }
          : {},
        canGoBack
          ? {
              actionKey: 'back',
              actionTitle: 'Back',
              icon: {
                iconType: 'SYSTEM',
                iconValue: 'arrowshape.backward',
              },
            }
          : {},
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canGoBack, canGoForward, isFavorite(formattedUrl), isGoogleSearch]
  );

  const onPressMenuItem = async ({
    nativeEvent: { actionKey },
  }: {
    nativeEvent: { actionKey: 'share' | 'favorite' | 'back' | 'forward' };
  }) => {
    haptics.selection();
    if (actionKey === 'favorite') {
      handleFavoritePress();
    } else if (actionKey === 'back') {
      goBack();
    } else if (actionKey === 'forward') {
      goForward();
    } else if (inputValue) {
      handleShareUrl(inputValue);
    }
  };

  const onSubmitEditing = useCallback(
    (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      inputRef.current?.blur();

      let newUrl = searchResults?.value?.[0]?.url ?? event.nativeEvent.text;

      if (!isValidURL(newUrl)) {
        newUrl = GOOGLE_SEARCH_URL + newUrl;
      } else if (!newUrl.startsWith(HTTP) && !newUrl.startsWith(HTTPS)) {
        newUrl = HTTPS + newUrl;
      }

      if (newUrl !== url) {
        updateActiveTabState({ url: newUrl }, tabId);
      } else {
        onRefresh();
      }
    },
    [inputRef, onRefresh, searchResults, tabId, updateActiveTabState, url]
  );

  const onPressWorklet = () => {
    'worklet';
    console.log('???');
    if (searchQuery) {
      searchQuery.value = url === RAINBOW_HOME ? '' : url;
    }
    if (isFocused) {
      isFocused.value = true;
    }
    if (searchViewProgress !== undefined) {
      searchViewProgress.value = withSpring(1, SPRING_CONFIGS.snappierSpringConfig);
    }
    dispatchCommand(inputRef, 'focus');
  };

  const onBlur = useCallback(() => {
    // if (searchQuery) {
    //   searchQuery.value = '';\
    // }
    if (searchViewProgress !== undefined) {
      searchViewProgress.value = withSpring(0, SPRING_CONFIGS.snappierSpringConfig);
    }
    if (isFocused) {
      isFocused.value ??= false;
    }
  }, [isFocused, searchViewProgress]);

  const onChange = useCallback(
    (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
      if (searchQuery) searchQuery.value = event.nativeEvent.text;
    },
    [searchQuery]
  );

  const animatedGestureHandlerV1ButtonProps = useAnimatedProps(() => ({
    disabled: isFocused?.value,
  }));

  const animatedFadeMaskProps = useAnimatedProps(() => ({
    fadeEdgeInset: isFocused?.value || !inputValue ? 0 : 36,
    fadeWidth: isFocused?.value || !inputValue ? 0 : 12,
  }));

  return (
    <BrowserButtonShadows>
      <Box as={Animated.View} justifyContent="center" style={pointerEventsStyle}>
        <AnimatedGestureHandlerV1Button
          animatedProps={animatedGestureHandlerV1ButtonProps}
          onPressWorklet={onPressWorklet}
          scaleTo={0.965}
          style={[
            buttonWrapperStyle,
            {
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            },
          ]}
        >
          <MaskedView
            maskElement={<FadeMask height={48} side="right" />}
            // maskElement={<AnimatedFadeMask height={48} side="right" />}
            style={{
              alignItems: 'center',
              flex: 1,
              flexDirection: 'row',
              height: 48,
              justifyContent: 'center',
              zIndex: 99,
            }}
          >
            <AnimatedInput
              clearButtonMode="while-editing"
              enablesReturnKeyAutomatically
              keyboardType="web-search"
              placeholder={i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder)}
              placeholderTextColor={labelQuaternary}
              onBlur={onBlur}
              onChange={onChange}
              onSubmitEditing={onSubmitEditing}
              ref={inputRef}
              returnKeyType="go"
              selectTextOnFocus
              spellCheck={false}
              style={[
                inputStyle,
                styles.input,
                {
                  color: label,
                },
              ]}
              textAlign="left"
              textAlignVertical="center"
              value={searchQuery}
              defaultValue={inputValue}
            />
            <Cover alignHorizontal="center" alignVertical="center" pointerEvents="none">
              <Box alignItems="center" as={Animated.View} height="full" justifyContent="center" style={formattedInputStyle} width="full">
                <AnimatedText
                  align={isHome ? 'center' : undefined}
                  color={isHome ? 'labelQuaternary' : 'label'}
                  ellipsizeMode="clip"
                  numberOfLines={1}
                  size="17pt"
                  style={[{ alignSelf: 'center', paddingHorizontal: isHome ? 0 : 40 }, hideFormattedUrlWhenTabChanges]}
                  weight="bold"
                >
                  {formattedUrlValue}
                </AnimatedText>
              </Box>
            </Cover>
          </MaskedView>
          {IS_IOS && (
            <Box
              as={AnimatedBlurView}
              blurAmount={20}
              blurType={isDarkMode ? 'dark' : 'light'}
              height={{ custom: 48 }}
              position="absolute"
              style={[{ borderCurve: 'continuous', borderRadius: 18 }, pointerEventsStyle]}
              width="full"
            />
          )}
          <Box
            as={Animated.View}
            borderRadius={18}
            height={{ custom: 48 }}
            position="absolute"
            style={[
              {
                backgroundColor: buttonColor,
                borderColor: separatorSecondary,
                borderWidth: IS_IOS && isDarkMode ? THICK_BORDER_WIDTH : 0,
                overflow: 'hidden',
              },
              pointerEventsStyle,
            ]}
            width="full"
          />
        </AnimatedGestureHandlerV1Button>
        <Box as={Animated.View} left="0px" position="absolute" style={toolbarIconStyle}>
          <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={onPressMenuItem}>
            <ToolbarIcon
              color="label"
              icon="􀍡"
              onPress={() => {
                return;
              }}
              side="left"
              size="icon 17px"
              weight="heavy"
            />
          </ContextMenuButton>
        </Box>
        <Box as={Animated.View} position="absolute" right="0px" style={toolbarIconStyle}>
          <ToolbarIcon color="label" icon="􀅈" onPress={onRefresh} side="right" size="icon 17px" weight="heavy" />
        </Box>
      </Box>
    </BrowserButtonShadows>
  );
};

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 20,
    height: IS_IOS ? 48 : 60,
    letterSpacing: 0.36,
    lineHeight: IS_IOS ? undefined : 24,
    marginRight: 7,
    paddingLeft: 16,
    paddingRight: 9,
    paddingVertical: 10,
    ...fontWithWidth(font.weight.semibold),
  },
});