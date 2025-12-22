import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../../theme/colors';
import { getTodaysServices } from '../data/todaysServices';
import { getMessageBoardPosts } from '../data/messageBoard';
import { getWordOfDay } from '../data/wordOfDay';
import { SectionCard } from '../components/SectionCard';
import type { RootStackParamList, RootTabParamList } from '../navigation/types';

export function HomeScreen() {
  type HomeNav = CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList>,
    NativeStackNavigationProp<RootStackParamList>
  >;

  const navigation = useNavigation<HomeNav>();

  const wordOfDay = useMemo(() => getWordOfDay(new Date()), []);
  const todaysServices = useMemo(() => getTodaysServices(new Date()), []);
  const messageBoardPosts = useMemo(() => getMessageBoardPosts(new Date()), []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
        <View style={styles.bannerRow}>
          <View style={styles.wordBanner} accessibilityRole="summary">
            <Text style={styles.bannerTitle} allowFontScaling>
              {wordOfDay.title}
            </Text>
            <Text style={styles.bannerWord} allowFontScaling>
              {wordOfDay.word}
            </Text>
            <Text style={styles.bannerMessage} allowFontScaling>
              {wordOfDay.message}
            </Text>
          </View>
        </View>

        <View style={styles.servicesRow}>
          <View style={styles.servicesRowHeader}>
            <Text style={styles.servicesTitle} allowFontScaling>
              Today’s Services
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Watch"
              onPress={() => navigation.navigate('Watch')}
              hitSlop={10}
            >
              <Text style={styles.servicesLink} allowFontScaling>
                Watch
              </Text>
            </Pressable>
          </View>

          <FlatList
            horizontal
            data={todaysServices}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesList}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open Watch. ${item.title}. ${item.timeLabel}.`}
                onPress={() => navigation.navigate('Watch')}
                style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}
              >
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
            )}
          />
        </View>

        <SectionCard title="Message Board" style={styles.messageBoardCard}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
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
  },
  bannerWord: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  bannerMessage: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  servicesRow: {
    gap: 8,
  },
  servicesRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servicesTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  servicesLink: {
    color: colors.button,
    fontSize: 16,
    fontWeight: '900',
  },
  servicesList: {
    gap: 12,
    paddingRight: 6,
  },
  serviceCard: {
    width: 240,
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 6,
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
