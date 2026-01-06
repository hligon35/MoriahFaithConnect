import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../../theme/colors';
import { ScreenContainer } from '../components/ScreenContainer';
import { getTodaysServices } from '../data/todaysServices';
import { getMessageBoardPosts } from '../data/messageBoard';
import { getWordOfDay } from '../data/wordOfDay';
import { SectionCard } from '../components/SectionCard';
import type { RootStackParamList, RootTabParamList } from '../navigation/types';

function parseClockTimeLabel(baseDate: Date, timeLabel: string) {
  const match = timeLabel.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  const hours12 = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (Number.isNaN(hours12) || Number.isNaN(minutes)) return null;
  if (hours12 < 1 || hours12 > 12) return null;
  if (minutes < 0 || minutes > 59) return null;

  let hours24 = hours12 % 12;
  if (meridiem === 'PM') hours24 += 12;

  const dt = new Date(baseDate);
  dt.setHours(hours24, minutes, 0, 0);
  return dt;
}

function isServiceLive(service: { timeLabel: string }, now: Date) {
  const start = parseClockTimeLabel(now, service.timeLabel);
  if (!start) return false;

  const startsAt = start.getTime();
  const windowStart = startsAt - 15 * 60 * 1000;
  const windowEnd = startsAt + 90 * 60 * 1000;
  const t = now.getTime();

  return t >= windowStart && t <= windowEnd;
}

export function HomeScreen() {
  type HomeNav = CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList>,
    NativeStackNavigationProp<RootStackParamList>
  >;

  const navigation = useNavigation<HomeNav>();

  const wordOfDay = useMemo(() => getWordOfDay(new Date()), []);
  const todaysServices = useMemo(() => getTodaysServices(new Date()), []);
  const messageBoardPosts = useMemo(() => getMessageBoardPosts(new Date()), []);

  const watchPulse = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(watchPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(watchPulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    anim.start();
    return () => anim.stop();
  }, [watchPulse]);

  const watchPulseStyle = useMemo(() => {
    const scale = watchPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
    const opacity = watchPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.78] });
    return { transform: [{ scale }], opacity };
  }, [watchPulse]);

  return (
    <ScreenContainer scroll={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
        <View style={styles.bannerRow}>
          <View style={styles.wordBanner} accessibilityRole="summary">
            <Text style={styles.bannerTitle} allowFontScaling>
              {wordOfDay.title}
            </Text>
            <View style={styles.bannerDivider} />
            <Text style={styles.bannerWord} allowFontScaling>
              {wordOfDay.word}
            </Text>
            <Text style={styles.bannerMessage} allowFontScaling>
              {wordOfDay.message}
            </Text>
          </View>
        </View>

        <SectionCard title="Today’s Services" style={styles.servicesCard}>
          {todaysServices.length <= 4 ? (
            <View style={styles.servicesGridRow}>
              {todaysServices.map((item) => {
                const live = isServiceLive(item, new Date());
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}. ${item.timeLabel}.`}
                    onPress={() => navigation.navigate('Watch')}
                    style={({ pressed }) => [
                      styles.serviceCard,
                      styles.serviceCardGrid,
                      pressed && styles.pressed,
                    ]}
                  >
                    {live && (
                      <Animated.View style={[styles.watchBadgeWrap, watchPulseStyle]}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Watch ${item.title} live`}
                          onPress={() => navigation.navigate('Watch')}
                          hitSlop={10}
                          style={({ pressed }) => [
                            styles.watchBadge,
                            pressed && styles.watchBadgePressed,
                          ]}
                        >
                          <Text style={styles.watchBadgeText} allowFontScaling>
                            WATCH
                          </Text>
                        </Pressable>
                      </Animated.View>
                    )}

                    <Text style={styles.serviceCardTitle} allowFontScaling numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.serviceCardMeta} allowFontScaling numberOfLines={1}>
                      {item.timeLabel}
                    </Text>
                    <Text style={styles.serviceCardMeta} allowFontScaling numberOfLines={1}>
                      {item.locationLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <FlatList
              horizontal
              data={todaysServices}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.servicesList}
              renderItem={({ item }) => {
                const live = isServiceLive(item, new Date());
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}. ${item.timeLabel}.`}
                    onPress={() => navigation.navigate('Watch')}
                    style={({ pressed }) => [
                      styles.serviceCard,
                      styles.serviceCardCarousel,
                      pressed && styles.pressed,
                    ]}
                  >
                    {live && (
                      <Animated.View style={[styles.watchBadgeWrap, watchPulseStyle]}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Watch ${item.title} live`}
                          onPress={() => navigation.navigate('Watch')}
                          hitSlop={10}
                          style={({ pressed }) => [
                            styles.watchBadge,
                            pressed && styles.watchBadgePressed,
                          ]}
                        >
                          <Text style={styles.watchBadgeText} allowFontScaling>
                            WATCH
                          </Text>
                        </Pressable>
                      </Animated.View>
                    )}

                    <Text style={styles.serviceCardTitle} allowFontScaling numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.serviceCardMeta} allowFontScaling numberOfLines={1}>
                      {item.timeLabel}
                    </Text>
                    <Text style={styles.serviceCardMeta} allowFontScaling numberOfLines={1}>
                      {item.locationLabel}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}
        </SectionCard>

        <SectionCard title="Announcements" style={styles.messageBoardCard}>
          <Text style={styles.messageBoardLead} allowFontScaling>
            Important updates from the church.
          </Text>

          <View style={styles.messageBoardList}>
            {messageBoardPosts.map((post) => (
              <View
                key={post.id}
                style={styles.messageBoardPost}
                accessibilityRole="text"
                accessibilityLabel={`${post.title}. ${post.body}`}
              >
                <Text style={styles.messageBoardTitle} allowFontScaling>
                  {post.pinned ? 'Pinned: ' : ''}
                  {post.title}
                </Text>
                <Text style={styles.messageBoardBody} allowFontScaling>
                  {post.body}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 25,
    paddingBottom: 25,
    gap: 10,
  },
  header: {
    gap: 10,
  },
  bannerRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  wordBanner: {
    flex: 1,
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  bannerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  bannerDivider: {
    alignSelf: 'center',
    width: '60%',
    height: 1,
    backgroundColor: colors.text,
  },
  bannerWord: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  bannerMessage: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  servicesCard: {
    gap: 10,
  },
  servicesList: {
    gap: 12,
    paddingRight: 6,
  },
  servicesGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceCard: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  serviceCardCarousel: {
    width: 240,
  },
  serviceCardGrid: {
    flex: 1,
  },
  serviceCardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  serviceCardMeta: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  watchBadgeWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  watchBadge: {
    backgroundColor: colors.button,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  watchBadgePressed: {
    opacity: 0.9,
  },
  watchBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.9,
  },
  messageBoardCard: {
    gap: 10,
  },
  messageBoardLead: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  messageBoardList: {
    gap: 10,
  },
  messageBoardPost: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  messageBoardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  messageBoardBody: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
