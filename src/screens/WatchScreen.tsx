import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { colors } from '../../theme/colors';

type ArchiveCategory = {
  id: string;
  title: string;
  description: string;
};

const archiveCategories: ArchiveCategory[] = [
  {
    id: 'sunday-sermons',
    title: 'Sunday Sermons',
    description: 'Weekly messages and series.',
  },
  {
    id: 'guest-ministry',
    title: 'Guest Ministry',
    description: 'Special guests and visiting speakers.',
  },
  {
    id: 'youth-events',
    title: 'Youth Events',
    description: 'Youth services and special events.',
  },
];

export function WatchScreen() {
  return (
    <ScreenContainer contentContainerStyle={styles.containerTight}>
      <View style={styles.liveCardWrap} accessibilityRole="summary">
        <View style={styles.liveRow}>
          <View style={styles.liveTextCol}>
            <Text style={styles.liveTitle} allowFontScaling>
              Live Stream
            </Text>
            <Text style={styles.bodyText} allowFontScaling>
              Live stream will appear here.
            </Text>
            <Text style={styles.liveMeta} allowFontScaling>
              Coming soon
            </Text>
          </View>

          <View style={styles.liveThumbFrame}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.liveThumbImage}
              accessibilityLabel="Live stream thumbnail"
            />
          </View>
        </View>
      </View>

      <SectionCard title="Sermon Archive">
        <Text style={styles.bodyText} allowFontScaling>
          Browse by category.
        </Text>

        <View style={styles.archiveList}>
          {archiveCategories.map((category) => (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityLabel={`${category.title}. Coming soon.`}
              onPress={() => {}}
              style={({ pressed }) => [styles.archiveCard, pressed && styles.archiveCardPressed]}
            >
              <Text style={styles.archiveTitle} allowFontScaling>
                {category.title}
              </Text>
              <Text style={styles.archiveDescription} allowFontScaling>
                {category.description}
              </Text>
              <Text style={styles.archiveMeta} allowFontScaling>
                Coming soon
              </Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  containerTight: {
    gap: 8,
  },
  bodyText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  liveCardWrap: {
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 104,
  },
  liveTextCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  liveTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  liveMeta: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  liveThumbImage: {
    width: 96,
    height: 104 ,
    resizeMode: 'cover',
    transform: [{ scale: 2 }],
  },
  archiveList: {
    gap: 8,
  },
  archiveCard: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  archiveCardPressed: {
    opacity: 0.9,
  },
  archiveTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  archiveDescription: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  archiveMeta: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
});
