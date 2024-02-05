import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Source } from 'react-native-fast-image';
import { KeyboardArea } from 'react-native-keyboard-area';

import * as lang from '@/languages';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import { cloudPlatform } from '@/utils/platform';
import { PasswordField } from '@/components/fields';
import { Text } from '@/components/text';
import WalletAndBackup from '@/assets/walletsAndBackup.png';
import { analytics } from '@/analytics';
import {
  cloudBackupPasswordMinLength,
  isCloudBackupPasswordValid,
} from '@/handlers/cloudBackup';
import {
  useDimensions,
  useMagicAutofocus,
  useRouteExistsInNavigationState,
  useWallets,
} from '@/hooks';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { Box, Inset, Stack } from '@/design-system';
import { ImgixImage } from '../images';
import { IS_ANDROID } from '@/env';
import { RainbowButton } from '../buttons';
import RainbowButtonTypes from '../buttons/rainbow-button/RainbowButtonTypes';
import { usePasswordValidation } from './usePasswordValidation';
import { useCreateBackup } from './useCreateBackup';
import { TextInput } from 'react-native';

type BackupCloudStepParams = {
  BackupCloudStep: {
    walletId?: string;
  };
};

type NativeEvent = {
  nativeEvent: {
    text: string;
  };
};

export function BackupCloudStep() {
  const { width: deviceWidth, height: deviceHeight } = useDimensions();
  const { params } = useRoute<
    RouteProp<BackupCloudStepParams, 'BackupCloudStep'>
  >();
  const { selectedWallet } = useWallets();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isSettingsRoute = !!useRouteExistsInNavigationState(
    Routes.SETTINGS_SHEET
  );

  const walletId = params?.walletId || selectedWallet.id;

  const { validPassword, label, labelColor } = usePasswordValidation(
    password,
    confirmPassword
  );
  const { onSubmit } = useCreateBackup({
    walletId,
    password,
    validPassword,
    isSettingsRoute,
  });

  const currentlyFocusedInput = useRef<TextInput | null>(null);
  const passwordRef = useRef<TextInput | null>(null);
  const confirmPasswordRef = useRef<TextInput | null>(null);

  useEffect(() => {
    setTimeout(() => {
      passwordRef.current?.focus();
    }, 1);
    analytics.track('Choose Password Step', {
      category: 'backup',
      label: cloudPlatform,
    });
  }, []);

  const { handleFocus } = useMagicAutofocus(passwordRef);

  const onTextInputFocus = useCallback(
    (target: any, isConfirm = false) => {
      const ref = isConfirm ? confirmPasswordRef.current : passwordRef.current;
      handleFocus(target);
      currentlyFocusedInput.current = ref;
    },
    [handleFocus]
  );

  const onPasswordSubmit = useCallback(() => {
    confirmPasswordRef.current?.focus();
  }, []);

  const onPasswordChange = useCallback(
    ({ nativeEvent: { text: inputText } }: NativeEvent) => {
      setPassword(inputText);
      setConfirmPassword('');
    },
    []
  );

  const onConfirmPasswordChange = useCallback(
    ({ nativeEvent: { text: inputText } }: NativeEvent) => {
      setConfirmPassword(inputText);
    },
    []
  );

  return (
    <Box height={{ custom: deviceHeight - sharedCoolModalTopOffset - 48 }}>
      <Inset horizontal={'24px'}>
        <Stack alignHorizontal="left" space="8px">
          <Masthead>
            <Box
              as={ImgixImage}
              borderRadius={72 / 2}
              height={{ custom: 72 }}
              marginLeft={{ custom: -12 }}
              marginRight={{ custom: -12 }}
              marginTop={{ custom: 8 }}
              marginBottom={{ custom: -24 }}
              source={WalletAndBackup as Source}
              width={{ custom: 72 }}
              size={72}
            />
            <Stack space="12px">
              <Title>
                {lang.t(lang.l.back_up.cloud.password.choose_a_password)}
              </Title>
              <DescriptionText>
                {lang.t(
                  lang.l.back_up.cloud.password
                    .a_password_youll_remember_part_one
                )}
                &nbsp;
                <ImportantText>
                  {lang.t(lang.l.back_up.cloud.password.not)}
                </ImportantText>
                &nbsp;
                {lang.t(
                  lang.l.back_up.cloud.password
                    .a_password_youll_remember_part_two
                )}
              </DescriptionText>
            </Stack>
          </Masthead>
          <Box gap={12}>
            <PasswordField
              key="password"
              isInvalid={
                password !== '' &&
                password.length < cloudBackupPasswordMinLength &&
                !passwordRef.current?.isFocused()
              }
              isValid={isCloudBackupPasswordValid(password)}
              onChange={onPasswordChange}
              onFocus={(target: any) => onTextInputFocus(target)}
              onSubmitEditing={onPasswordSubmit}
              password={password}
              placeholder={lang.t(
                lang.l.back_up.cloud.password.backup_password
              )}
              ref={passwordRef}
              returnKeyType="next"
              textContentType="newPassword"
            />
            {isCloudBackupPasswordValid(password) && (
              <PasswordField
                key="confirm-password"
                editable={isCloudBackupPasswordValid(password)}
                isInvalid={
                  isCloudBackupPasswordValid(confirmPassword) &&
                  confirmPassword.length >= password.length &&
                  confirmPassword !== password
                }
                isValid={validPassword}
                onChange={onConfirmPasswordChange}
                onFocus={(target: any) => onTextInputFocus(target, true)}
                onSubmitEditing={onSubmit}
                password={confirmPassword}
                placeholder={lang.t(
                  lang.l.back_up.cloud.password.confirm_placeholder
                )}
                ref={confirmPasswordRef}
              />
            )}

            <DescriptionText color={labelColor}>{label}</DescriptionText>
          </Box>
        </Stack>

        <Box paddingTop="16px" justifyContent="flex-end">
          <RainbowButton
            height={46}
            width={deviceWidth - 48}
            disabled={!validPassword}
            type={RainbowButtonTypes.backup}
            label={`􀎽 ${lang.t(lang.l.back_up.cloud.back_up_to_platform, {
              cloudPlatformName: cloudPlatform,
            })}`}
            onPress={onSubmit}
          />
          {IS_ANDROID ? <KeyboardSizeView /> : null}
        </Box>
      </Inset>
    </Box>
  );
}

export default BackupCloudStep;

const DescriptionText = styled(Text).attrs(
  ({ theme: { colors }, color }: any) => ({
    align: 'left',
    color: color || colors.alpha(colors.blueGreyDark, 0.5),
    lineHeight: 'looser',
    size: 'lmedium',
    weight: 'medium',
  })
)({});

const KeyboardSizeView = styled(KeyboardArea)({
  backgroundColor: ({ theme: { colors } }: any) => colors.transparent,
});

const ImportantText = styled(DescriptionText).attrs(
  ({ theme: { colors } }: any) => ({
    color: colors.red,
    weight: 'bold',
  })
)({});

const Masthead = styled(Box).attrs({
  direction: 'column',
})({
  ...padding.object(0, 0, 16),
  gap: 8,
  flexShrink: 0,
});

const Title = styled(Text).attrs({
  size: 'big',
  weight: 'heavy',
})({
  ...padding.object(12, 0, 0),
});
