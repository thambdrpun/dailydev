import React, { ReactElement, useMemo, type PropsWithChildren } from 'react';
import { desktop, laptop, laptopL, laptopXL, tablet } from '../styles/media';
import { useConditionalFeature, useMedia } from '../hooks';
import { useSettingsContext } from './SettingsContext';
import useSidebarRendered from '../hooks/useSidebarRendered';
import { feature } from '../lib/featureManagement';

import { Spaciness } from '../graphql/settings';
import { usePlusSubscription } from '../hooks/usePlusSubscription';

export type FeedContextData = {
  pageSize: number;
  numCards: Record<Spaciness, number>;
};

type FeedSettingsKeys =
  | 'default'
  | 'tablet'
  | 'laptop'
  | 'laptopL'
  | 'laptopXL'
  | 'desktop';

export type FeedSettings = {
  pageSize: number;
  breakpoint?: string;
  numCards: {
    eco: number;
    roomy: number;
    cozy: number;
  };
};

const baseFeedSettings: Record<FeedSettingsKeys, FeedSettings> = {
  default: {
    pageSize: 7,
    numCards: {
      cozy: 1,
      eco: 1,
      roomy: 1,
    },
  },
  tablet: {
    pageSize: 9,
    breakpoint: tablet,
    numCards: {
      eco: 2,
      roomy: 2,
      cozy: 1,
    },
  },
  laptop: {
    pageSize: 13,
    breakpoint: laptop,
    numCards: {
      eco: 3,
      roomy: 2,
      cozy: 2,
    },
  },
  laptopL: {
    pageSize: 17,
    breakpoint: laptopL,
    numCards: {
      eco: 4,
      roomy: 3,
      cozy: 3,
    },
  },
  laptopXL: {
    pageSize: 21,
    breakpoint: laptopXL,
    numCards: {
      eco: 5,
      roomy: 4,
      cozy: 3,
    },
  },
  desktop: {
    pageSize: 25,
    breakpoint: desktop,
    numCards: {
      eco: 6,
      roomy: 5,
      cozy: 4,
    },
  },
};

const digitsRegex = /\d+/;

const replaceDigitsWithIncrement = (str: string, increment: number): string => {
  const match = str.match(digitsRegex);
  if (!match) {
    return str;
  }
  return str.replace(match[0], `${parseInt(match[0], 10) + increment}`);
};

const sidebarRenderedWidth = 44;
const sidebarOpenWidth = 240;

const FeedContext = React.createContext<FeedContextData>(
  baseFeedSettings.default,
);

export function FeedLayoutProvider({
  children,
}: PropsWithChildren): ReactElement {
  const { sidebarExpanded } = useSettingsContext();
  const { sidebarRendered } = useSidebarRendered();
  const { isPlus } = usePlusSubscription();
  const { value: feedPageSizes } = useConditionalFeature({
    feature: feature.feedPageSizes,
    shouldEvaluate: !isPlus,
  });

  const { feedSettings, defaultFeedSettings } = useMemo(() => {
    Object.keys(baseFeedSettings).forEach((key) => {
      const pageSize = feedPageSizes[key as FeedSettingsKeys];
      if (!pageSize) {
        return;
      }

      baseFeedSettings[key as FeedSettingsKeys].pageSize = pageSize;
    });

    return {
      feedSettings: [
        baseFeedSettings.desktop,
        baseFeedSettings.laptopXL,
        baseFeedSettings.laptopL,
        baseFeedSettings.laptop,
        baseFeedSettings.tablet,
      ],
      defaultFeedSettings: baseFeedSettings.default,
    };
  }, [feedPageSizes]);

  // Generate the breakpoints for the feed settings
  const feedBreakpoints = useMemo(() => {
    const breakpoints = feedSettings.map((setting) =>
      setting.breakpoint.replace('@media ', ''),
    );

    if (!sidebarRendered) {
      return breakpoints;
    }

    if (sidebarExpanded) {
      return breakpoints.map((breakpoint) =>
        replaceDigitsWithIncrement(breakpoint, sidebarOpenWidth),
      );
    }

    return breakpoints.map((breakpoint) =>
      replaceDigitsWithIncrement(breakpoint, sidebarRenderedWidth),
    );
  }, [feedSettings, sidebarExpanded, sidebarRendered]);

  const currentSettings = useMedia(
    feedBreakpoints,
    feedSettings,
    defaultFeedSettings,
  );

  return (
    <FeedContext.Provider value={currentSettings}>
      {children}
    </FeedContext.Provider>
  );
}

export default FeedContext;
