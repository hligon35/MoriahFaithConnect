import { Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { useAdmin } from '../state/AdminContext';
import { loadArchiveCategories, saveArchiveCategories, type ArchiveCategory } from '../storage/watchAdminStore';

const defaultArchiveCategories: ArchiveCategory[] = [
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
  const { adminEnabled } = useAdmin();
  const [categories, setCategories] = useState<ArchiveCategory[]>(defaultArchiveCategories);
  const [adminAddOpen, setAdminAddOpen] = useState(false);
  const [adminDraft, setAdminDraft] = useState({ title: '', description: '' });

  useEffect(() => {
    (async () => {
      const stored = await loadArchiveCategories();
      if (stored && stored.length) setCategories(stored);
    })();
  }, []);

  const adminSave = async (next: ArchiveCategory[]) => {
    setCategories(next);
    await saveArchiveCategories(next);
  };

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

      <SectionCard
        title="Sermon Archive"
        headerRight={
          adminEnabled ? (
            <IconButton
              icon="add"
              accessibilityLabel="Add sermon archive category"
              onPress={() => {
                setAdminDraft({ title: '', description: '' });
                setAdminAddOpen(true);
              }}
              iconColor={colors.primary}
              variant="outlined"
              iconSize={22}
              buttonSize={34}
            />
          ) : undefined
        }
      >
        <Text style={styles.bodyText} allowFontScaling>
          Browse by category.
        </Text>

        <View style={styles.archiveList}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityLabel={`${category.title}. Coming soon.`}
              onPress={() => {}}
              style={({ pressed }) => [styles.archiveCard, pressed && styles.archiveCardPressed]}
            >
              {adminEnabled && (
                <View style={styles.archiveAdminRow}>
                  <IconButton
                    icon="delete"
                    accessibilityLabel={`Delete category ${category.title}`}
                    onPress={() => adminSave(categories.filter((c) => c.id !== category.id))}
                    iconSize={22}
                    buttonSize={34}
                    variant="outlined"
                  />
                </View>
              )}
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

      <Modal
        visible={adminAddOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAdminAddOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle} allowFontScaling>
                  Add Archive Category
                </Text>
                <Text style={styles.modalSubtitle} allowFontScaling>
                  Add/edit sermon archive sections.
                </Text>
              </View>
              <IconButton
                icon="close"
                accessibilityLabel="Close"
                onPress={() => setAdminAddOpen(false)}
                iconSize={22}
                buttonSize={36}
              />
            </View>

            <View style={styles.modalDivider} />

            <Text style={styles.modalFieldLabel} allowFontScaling>
              Title
            </Text>
            <TextInput
              value={adminDraft.title}
              onChangeText={(t) => setAdminDraft((d) => ({ ...d, title: t }))}
              placeholder="Sunday Sermons"
              placeholderTextColor={colors.text}
              style={styles.modalInput}
              accessibilityLabel="Category title"
            />

            <Text style={styles.modalFieldLabel} allowFontScaling>
              Description
            </Text>
            <TextInput
              value={adminDraft.description}
              onChangeText={(t) => setAdminDraft((d) => ({ ...d, description: t }))}
              placeholder="Weekly messages and series."
              placeholderTextColor={colors.text}
              style={styles.modalTextArea}
              multiline
              accessibilityLabel="Category description"
            />

            <View style={styles.modalActionRow}>
              <PrimaryButton title="Cancel" onPress={() => setAdminAddOpen(false)} />
              <PrimaryButton
                title="Save"
                onPress={async () => {
                  const title = adminDraft.title.trim();
                  const description = adminDraft.description.trim();
                  if (!title) return;

                  const next: ArchiveCategory = {
                    id: `cat-${Date.now()}`,
                    title,
                    description,
                  };
                  await adminSave([next, ...categories]);
                  setAdminAddOpen(false);
                }}
                disabled={!adminDraft.title.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  liveThumbFrame: {
    width: 96,
    borderRadius: 12,
    overflow: 'hidden',
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: colors.background,
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
    transform: [{ scale: 1 }],
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
  archiveAdminRow: {
    alignSelf: 'flex-end',
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

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalTitleWrap: {
    flex: 1,
    gap: 2,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.primary,
  },
  modalFieldLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  modalInput: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  modalTextArea: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 96,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlignVertical: 'top',
  },
  modalActionRow: {
    gap: 10,
  },
});
