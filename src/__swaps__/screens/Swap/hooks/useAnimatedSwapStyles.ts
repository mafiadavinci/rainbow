/* eslint-disable no-nested-ternary */
import { SharedValue, interpolate, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { globalColors, useColorMode } from '@/design-system';
import {
  BASE_INPUT_HEIGHT,
  BOTTOM_ACTION_BAR_HEIGHT,
  EXPANDED_INPUT_HEIGHT,
  FOCUSED_INPUT_HEIGHT,
  THICK_BORDER_WIDTH,
  fadeConfig,
  springConfig,
} from '@/__swaps__/screens/Swap/constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useSwapInputsController } from '@/__swaps__/screens/Swap/hooks/useSwapInputsController';
import { SwapWarningType, useSwapWarning } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';
import { spinnerExitConfig } from '@/__swaps__/components/animations/AnimatedSpinner';
import { NavigationSteps } from './useSwapNavigation';
import { IS_ANDROID } from '@/env';
import { safeAreaInsetValues } from '@/utils';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';

export function useAnimatedSwapStyles({
  SwapInputController,
  SwapWarning,
  inputProgress,
  outputProgress,
  configProgress,
  isFetching,
}: {
  SwapInputController: ReturnType<typeof useSwapInputsController>;
  SwapWarning: ReturnType<typeof useSwapWarning>;
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  configProgress: SharedValue<NavigationSteps>;
  isFetching: SharedValue<boolean>;
}) {
  const { isDarkMode } = useColorMode();

  const insetBottom = IS_ANDROID ? getSoftMenuBarHeight() - 24 : safeAreaInsetValues.bottom + 16;

  const flipButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(
            interpolate(inputProgress.value, [0, 1, 2], [0, 0, EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT], 'clamp'),
            springConfig
          ),
        },
      ],
    };
  });

  const focusedSearchStyle = useAnimatedStyle(() => {
    return {
      opacity: inputProgress.value === 2 || outputProgress.value === 2 ? withTiming(0, fadeConfig) : withTiming(1, fadeConfig),
      pointerEvents: inputProgress.value === 2 || outputProgress.value === 2 ? 'none' : 'auto',
    };
  });

  const hideWhenInputsExpandedOrNoPriceImpact = useAnimatedStyle(() => {
    return {
      opacity:
        SwapWarning.swapWarning.value.type === SwapWarningType.none || inputProgress.value > 0 || outputProgress.value > 0
          ? withTiming(0, fadeConfig)
          : withTiming(1, fadeConfig),
      pointerEvents:
        SwapWarning.swapWarning.value.type === SwapWarningType.none || inputProgress.value > 0 || outputProgress.value > 0
          ? 'none'
          : 'auto',
    };
  });

  const hideWhenInputsExpandedOrPriceImpact = useAnimatedStyle(() => {
    return {
      opacity:
        SwapWarning.swapWarning.value.type !== SwapWarningType.none || inputProgress.value > 0 || outputProgress.value > 0
          ? withTiming(0, fadeConfig)
          : withTiming(1, fadeConfig),
      pointerEvents:
        SwapWarning.swapWarning.value.type !== SwapWarningType.none || inputProgress.value > 0 || outputProgress.value > 0
          ? 'none'
          : 'auto',
    };
  });

  const inputStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(inputProgress.value, [0, 1], [1, 0], 'clamp'), fadeConfig),
      pointerEvents: inputProgress.value === 0 ? 'auto' : 'none',
    };
  });

  const inputTokenListStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(inputProgress.value, [0, 1], [0, 1], 'clamp'), fadeConfig),
      pointerEvents: inputProgress.value === 0 ? 'none' : 'auto',
    };
  });

  const keyboardStyle = useAnimatedStyle(() => {
    const progress = Math.min(inputProgress.value + outputProgress.value, 1);

    return {
      opacity: withTiming(1 - progress, fadeConfig),
      transform: [
        {
          translateY: withSpring(progress * (EXPANDED_INPUT_HEIGHT - BASE_INPUT_HEIGHT), springConfig),
        },
        { scale: withSpring(0.925 + (1 - progress) * 0.075, springConfig) },
      ],
    };
  });

  const outputStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(outputProgress.value, [0, 1], [1, 0], 'clamp'), fadeConfig),
      pointerEvents: outputProgress.value === 0 ? 'auto' : 'none',
    };
  });

  const outputTokenListStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(outputProgress.value, [0, 1], [0, 1], 'clamp'), fadeConfig),
      pointerEvents: outputProgress.value === 0 ? 'none' : 'auto',
    };
  });

  const swapActionWrapperStyle = useAnimatedStyle(() => {
    const isReviewingOrConfiguringGas =
      configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS;

    const heightForPanel: { [key in NavigationSteps]: number } = {
      [NavigationSteps.INPUT_ELEMENT_FOCUSED]: BOTTOM_ACTION_BAR_HEIGHT,
      [NavigationSteps.SEARCH_FOCUSED]: BOTTOM_ACTION_BAR_HEIGHT,
      [NavigationSteps.TOKEN_LIST_FOCUSED]: BOTTOM_ACTION_BAR_HEIGHT,
      [NavigationSteps.SHOW_REVIEW]: 407.68 + insetBottom,
      [NavigationSteps.SHOW_GAS]: 407.68 + insetBottom,
    };

    return {
      position: isReviewingOrConfiguringGas ? 'absolute' : 'relative',
      bottom: isReviewingOrConfiguringGas ? 0 : undefined,
      height: withSpring(heightForPanel[configProgress.value], springConfig),
      borderTopLeftRadius: isReviewingOrConfiguringGas ? (IS_ANDROID ? 20 : 40) : 0,
      borderTopRightRadius: isReviewingOrConfiguringGas ? (IS_ANDROID ? 20 : 40) : 0,
      borderWidth: isReviewingOrConfiguringGas ? THICK_BORDER_WIDTH : 0,
      borderColor: isReviewingOrConfiguringGas ? opacityWorklet(globalColors.darkGrey, 0.2) : undefined,
      // TODO: Add mix here to mix bottom color with bg color for review / gas panels
      backgroundColor: opacityWorklet(SwapInputController.bottomColor.value, 0.03),
      borderTopColor: isReviewingOrConfiguringGas
        ? opacityWorklet(globalColors.darkGrey, 0.2)
        : opacityWorklet(SwapInputController.bottomColor.value, 0.04),
      paddingTop: isReviewingOrConfiguringGas ? 28 : 16 - THICK_BORDER_WIDTH,
    };
  });

  const assetToSellIconStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: SwapInputController.topColor.value,
    };
  });

  const assetToSellCaretStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: SwapInputController.topColor.value,
    };
  });

  const assetToBuyIconStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: SwapInputController.bottomColor.value,
    };
  });

  const assetToBuyCaretStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: SwapInputController.bottomColor.value,
    };
  });

  const flipButtonFetchingStyle = useAnimatedStyle(() => {
    return {
      borderWidth: isFetching ? withTiming(2, { duration: 300 }) : withTiming(THICK_BORDER_WIDTH, spinnerExitConfig),
    };
  });

  const searchInputAssetButtonStyle = useAnimatedStyle(() => {
    return {
      color: SwapInputController.topColor.value,
    };
  });

  const searchOutputAssetButtonStyle = useAnimatedStyle(() => {
    return {
      color: SwapInputController.bottomColor.value,
    };
  });

  const hideWhileReviewingOrConfiguringGas = useAnimatedStyle(() => {
    return {
      opacity:
        configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS
          ? withTiming(0, fadeConfig)
          : withTiming(1, fadeConfig),
      pointerEvents:
        configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS ? 'none' : 'auto',
    };
  });

  const searchInputAssetButtonWrapperStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: opacityWorklet(SwapInputController.topColor.value, isDarkMode ? 0.1 : 0.08),
      borderColor: opacityWorklet(SwapInputController.topColor.value, isDarkMode ? 0.06 : 0.01),
      borderWidth: THICK_BORDER_WIDTH,
    };
  });

  const searchOutputAssetButtonWrapperStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: opacityWorklet(SwapInputController.bottomColor.value, isDarkMode ? 0.1 : 0.08),
      borderColor: opacityWorklet(SwapInputController.bottomColor.value, isDarkMode ? 0.06 : 0.01),
      borderWidth: THICK_BORDER_WIDTH,
    };
  });

  return {
    flipButtonStyle,
    focusedSearchStyle,
    hideWhenInputsExpandedOrPriceImpact,
    hideWhenInputsExpandedOrNoPriceImpact,
    inputStyle,
    inputTokenListStyle,
    keyboardStyle,
    outputStyle,
    outputTokenListStyle,
    swapActionWrapperStyle,
    assetToSellIconStyle,
    assetToSellCaretStyle,
    assetToBuyIconStyle,
    assetToBuyCaretStyle,
    hideWhileReviewingOrConfiguringGas,
    flipButtonFetchingStyle,
    searchInputAssetButtonStyle,
    searchOutputAssetButtonStyle,
    searchInputAssetButtonWrapperStyle,
    searchOutputAssetButtonWrapperStyle,
  };
}
