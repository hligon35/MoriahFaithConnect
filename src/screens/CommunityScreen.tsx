import { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
} from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { colors } from '../../theme/colors';
import { churchDirectory, type DirectoryMember } from '../data/churchDirectory';
import { AvatarCircle } from '../components/AvatarCircle';
import { MaterialIcons } from '@expo/vector-icons';
import { defaultPrivacySettings, loadPrivacySettings, type PrivacySettings } from '../storage/privacyPrefs';
import { prayerWallEntries } from '../data/prayerWall';
import { ministries, type Ministry } from '../data/ministries';

function sanitizePhoneForLinking(phone: string) {
  // Keep leading + and digits only
  return phone.replace(/(?!^)\D+/g, '').replace(/^00/, '+');
}

async function openEmail(email: string) {
  const url = `mailto:${encodeURIComponent(email)}`;
  await Linking.openURL(url);
}

async function openCall(phone: string) {
  const sanitized = sanitizePhoneForLinking(phone);
  const url = `tel:${sanitized}`;
  await Linking.openURL(url);
}

async function openText(phone: string) {
  const sanitized = sanitizePhoneForLinking(phone);
  const url = `sms:${sanitized}`;
  await Linking.openURL(url);
}

async function openMaps(address: string) {
  const query = encodeURIComponent(address);
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  await Linking.openURL(url);
}

export function CommunityScreen() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<DirectoryMember | null>(null);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [myPrivacy, setMyPrivacy] = useState<PrivacySettings>(defaultPrivacySettings);

  useEffect(() => {
    (async () => {
      const loaded = await loadPrivacySettings();
      setMyPrivacy(loaded);
    })();
  }, []);

  const filteredDirectory = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return churchDirectory;

    return churchDirectory.filter((m) => {
      return (
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      );
    });
  }, [query]);

  const selectedVisibility = useMemo<PrivacySettings>(() => {
    // Placeholder: treat member m-001 as the current user whose privacy is configurable in Settings.
    if (!selected) return defaultPrivacySettings;
    if (selected.id === 'm-001') return myPrivacy;
    return defaultPrivacySettings;
  }, [selected, myPrivacy]);

  return (
    <ScreenContainer>
      <View style={styles.directoryCard}>
        <Text style={styles.directoryTitle} allowFontScaling>
          Church Directory
        </Text>

        <View style={styles.searchRow}>
          <MaterialIcons name="search" size={22} color={colors.text} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or role"
            placeholderTextColor={colors.text}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Search church directory"
          />
          {!!query && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setQuery('')}
              hitSlop={10}
            >
              <MaterialIcons name="close" size={22} color={colors.text} />
            </Pressable>
          )}
        </View>

        <FlatList
          horizontal
          data={filteredDirectory}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.directoryList}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open directory profile for ${item.name}`}
              onPress={() => setSelected(item)}
              style={({ pressed }) => [styles.memberChip, pressed && styles.pressed]}
            >
              <AvatarCircle name={item.name} size={52} />
              <Text style={styles.memberName} allowFontScaling numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.memberRole} allowFontScaling numberOfLines={1}>
                {item.role}
              </Text>
            </Pressable>
          )}
        />

        <View style={styles.ministriesSection}>
          <Text style={styles.directoryTitle} allowFontScaling>
            Ministries
          </Text>

          <FlatList
            horizontal
            data={ministries}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.directoryList}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ministry: ${item.name}`}
                onPress={() => setSelectedMinistry(item)}
                style={({ pressed }) => [styles.ministryChip, pressed && styles.pressed]}
              >
                <Text style={styles.ministryName} allowFontScaling numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.ministrySummary} allowFontScaling numberOfLines={2}>
                  {item.summary}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </View>

      <SectionCard title="Prayer Wall">
        <Text style={styles.bodyText} allowFontScaling>
          Names in need of prayer...
        </Text>

        <View style={styles.prayerListWrap}>
          <FlatList
            data={prayerWallEntries}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View
                style={[styles.prayerRow, index === 0 && styles.prayerRowFirst]}
                accessibilityRole="text"
                accessibilityLabel={`Prayer name: ${item.name}`}
              >
                <Text style={styles.prayerName} allowFontScaling>
                  {item.name}
                </Text>
              </View>
            )}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          />
        </View>
      </SectionCard>

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalName} allowFontScaling>
                  {selected?.name}
                </Text>
                <Text style={styles.modalRole} allowFontScaling>
                  {selected?.role}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close profile"
                onPress={() => setSelected(null)}
                hitSlop={10}
              >
                <MaterialIcons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Email"
                onPress={() => selected && selectedVisibility.email && openEmail(selected.email)}
                disabled={!selectedVisibility.email}
                style={({ pressed }) => [styles.actionIcon, pressed && styles.pressed, !selectedVisibility.email && styles.disabled]}
              >
                <MaterialIcons name="email" size={28} color={colors.text} />
                <Text style={styles.actionLabel} allowFontScaling>
                  Email
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Call"
                onPress={() => selected && selectedVisibility.phone && openCall(selected.phone)}
                disabled={!selectedVisibility.phone}
                style={({ pressed }) => [styles.actionIcon, pressed && styles.pressed, !selectedVisibility.phone && styles.disabled]}
              >
                <MaterialIcons name="call" size={28} color={colors.text} />
                <Text style={styles.actionLabel} allowFontScaling>
                  Call
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Text"
                onPress={() => selected && selectedVisibility.phone && openText(selected.phone)}
                disabled={!selectedVisibility.phone}
                style={({ pressed }) => [styles.actionIcon, pressed && styles.pressed, !selectedVisibility.phone && styles.disabled]}
              >
                <MaterialIcons name="message" size={28} color={colors.text} />
                <Text style={styles.actionLabel} allowFontScaling>
                  Text
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Address"
                onPress={() => selected && selectedVisibility.address && openMaps(selected.address)}
                disabled={!selectedVisibility.address}
                style={({ pressed }) => [styles.actionIcon, pressed && styles.pressed, !selectedVisibility.address && styles.disabled]}
              >
                <MaterialIcons name="location-on" size={28} color={colors.text} />
                <Text style={styles.actionLabel} allowFontScaling>
                  Address
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedMinistry}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMinistry(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalName} allowFontScaling>
                  {selectedMinistry?.name}
                </Text>
                <Text style={styles.modalRole} allowFontScaling>
                  {selectedMinistry?.meetingSchedule}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close ministry"
                onPress={() => setSelectedMinistry(null)}
                hitSlop={10}
              >
                <MaterialIcons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.bodyText} allowFontScaling>
              {selectedMinistry?.summary}
            </Text>

            <View style={styles.ministryMetaBox}>
              <Text style={styles.ministryMetaTitle} allowFontScaling>
                Contact
              </Text>
              <Text style={styles.ministryMetaLine} allowFontScaling>
                {selectedMinistry?.contactName} • {selectedMinistry?.contactRole}
              </Text>
              <Text style={styles.ministryMetaLine} allowFontScaling>
                {selectedMinistry?.contactEmail}
              </Text>
              <Text style={styles.ministryMetaLine} allowFontScaling>
                {selectedMinistry?.contactPhone}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Email contact"
                onPress={() => selectedMinistry && openEmail(selectedMinistry.contactEmail)}
                style={({ pressed }) => [styles.actionIcon, pressed && styles.pressed]}
              >
                <MaterialIcons name="email" size={28} color={colors.text} />
                <Text style={styles.actionLabel} allowFontScaling>
                  Email
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Call contact"
                onPress={() => selectedMinistry && openCall(selectedMinistry.contactPhone)}
                style={({ pressed }) => [styles.actionIcon, pressed && styles.pressed]}
              >
                <MaterialIcons name="call" size={28} color={colors.text} />
                <Text style={styles.actionLabel} allowFontScaling>
                  Call
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Text contact"
                onPress={() => selectedMinistry && openText(selectedMinistry.contactPhone)}
                style={({ pressed }) => [styles.actionIcon, pressed && styles.pressed]}
              >
                <MaterialIcons name="message" size={28} color={colors.text} />
                <Text style={styles.actionLabel} allowFontScaling>
                  Text
                </Text>
              </Pressable>
            </View>

            <View style={styles.ministryMetaBox}>
              <Text style={styles.ministryMetaTitle} allowFontScaling>
                Members
              </Text>
              {selectedMinistry?.members.map((m) => (
                <Text key={m} style={styles.ministryMetaLine} allowFontScaling>
                  {m}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  directoryCard: {
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  directoryTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  directoryList: {
    gap: 12,
    paddingRight: 6,
  },
  ministriesSection: {
    gap: 10,
  },
  ministryChip: {
    width: 200,
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  ministryName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  ministrySummary: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  memberChip: {
    width: 150,
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  memberName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  memberRole: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
  lead: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  bodyText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  prayerListWrap: {
    maxHeight: 220,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  prayerRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopColor: colors.primary,
    borderTopWidth: 1,
  },
  prayerRowFirst: {
    borderTopWidth: 0,
  },
  prayerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  ministryMetaBox: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  ministryMetaTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  ministryMetaLine: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 16,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 18,
    borderColor: colors.primary,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitleWrap: {
    flex: 1,
    gap: 2,
  },
  modalName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  modalRole: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionIcon: {
    flex: 1,
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.55,
  },
});
