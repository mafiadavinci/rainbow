import React from 'react';
import { AccentColorProvider, Box, Text } from '@/design-system';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';

const ORB_SIZE = 36;
interface IconOrbProps {
  color: string;
  shadowColor?: 'accent' | 'shadow';
  icon: string;
  loaded?: boolean;
}

export const IconOrb = ({
  color,
  icon,
  loaded = true,
  shadowColor,
}: IconOrbProps) =>
  loaded ? (
    <AccentColorProvider color={color}>
      {shadowColor ? (
        <Box
          width={{ custom: ORB_SIZE }}
          height={{ custom: ORB_SIZE }}
          borderRadius={ORB_SIZE / 2}
          background="accent"
          alignItems="center"
          justifyContent="center"
          shadow={shadowColor === 'accent' ? '18px accent' : '18px'}
        >
          <Text
            containsEmoji
            size="17pt"
            weight="bold"
            align="center"
            color="label"
          >
            {icon}
          </Text>
        </Box>
      ) : (
        <Box
          width={{ custom: ORB_SIZE }}
          height={{ custom: ORB_SIZE }}
          borderRadius={ORB_SIZE / 2}
          background="accent"
          alignItems="center"
          justifyContent="center"
        >
          <Text
            containsEmoji
            size="17pt"
            weight="bold"
            align="center"
            color="label"
          >
            {icon}
          </Text>
        </Box>
      )}
    </AccentColorProvider>
  ) : (
    <Box height={{ custom: ORB_SIZE }}>
      <Skeleton>
        <FakeText height={ORB_SIZE} width={ORB_SIZE} />
      </Skeleton>
    </Box>
  );