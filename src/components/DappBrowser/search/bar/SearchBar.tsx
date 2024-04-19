import React from 'react';
import Animated, { SharedValue, interpolate, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box } from '@/design-system';
import { IS_IOS } from '@/env';
import { useKeyboardHeight, useDimensions } from '@/hooks';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { AccountIcon } from './AccountIcon';
import { SearchInput } from './SearchInput';
import { TabButton } from './TabButton';
import { useSearchContext } from '../SearchContext';
import { TabState } from '../../types';

export const SEARCH_BAR_HEIGHT = 88;

export const SearchBar = ({
  activeTabIndex,
  getActiveTabState,
  animatedActiveTabIndex,
  toggleTabViewWorklet,
  tabViewVisible,
  tabViewProgress,
  tabStates,
  updateActiveTabState,
}: {
  activeTabIndex: number;
  getActiveTabState: () => TabState | undefined;
  animatedActiveTabIndex: SharedValue<number> | undefined;
  toggleTabViewWorklet(tabIndex?: number): void;
  tabViewVisible: SharedValue<boolean> | undefined;
  tabViewProgress: SharedValue<number> | undefined;
  tabStates: TabState[];
  updateActiveTabState: (newState: Partial<TabState>, tabId?: string | undefined) => void;
}) => {
  const { width: deviceWidth } = useDimensions();
  const { isFocused } = useSearchContext();

  const keyboardHeight = useKeyboardHeight({ shouldListen: true });

  const accountIconStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isFocused?.value ? 0 : 1, SPRING_CONFIGS.keyboardConfig),
    pointerEvents: isFocused?.value ? 'none' : 'auto',
  }));

  const barStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value ?? 0;

    return {
      opacity: 1 - progress / 75,
      paddingLeft: withSpring(isFocused?.value ? 16 : 72, SPRING_CONFIGS.keyboardConfig),
      pointerEvents: tabViewVisible?.value ? 'none' : 'auto',
      transform: [
        {
          scale: interpolate(progress, [0, 100], [1, 0.95]),
        },
      ],
    };
  });

  const bottomBarStyle = useAnimatedStyle(() => {
    const translateY = isFocused?.value ? -(keyboardHeight - (IS_IOS ? 82 : 46)) : 0;

    return {
      transform: [
        {
          translateY: withSpring(translateY, SPRING_CONFIGS.keyboardConfig),
        },
      ],
    };
  });

  return (
    <Box
      as={Animated.View}
      bottom={{ custom: 0 }}
      paddingTop="20px"
      pointerEvents="box-none"
      position="absolute"
      style={[bottomBarStyle, { height: TAB_BAR_HEIGHT + SEARCH_BAR_HEIGHT, zIndex: 10000 }]}
      width={{ custom: deviceWidth }}
    >
      <Box
        as={Animated.View}
        paddingRight="16px"
        style={[{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }, barStyle]}
        width="full"
      >
        <Box as={Animated.View} position="absolute" style={[accountIconStyle, { left: 24 }]}>
          <AccountIcon activeTabIndex={activeTabIndex} getActiveTabState={getActiveTabState} />
        </Box>

        <Box paddingRight="12px" style={{ flex: 1 }}>
          <SearchInput
            activeTabIndex={activeTabIndex}
            animatedActiveTabIndex={animatedActiveTabIndex}
            tabViewProgress={tabViewProgress}
            tabStates={tabStates}
            updateActiveTabState={updateActiveTabState}
          />
        </Box>
        <TabButton toggleTabViewWorklet={toggleTabViewWorklet} />
      </Box>
    </Box>
  );
};