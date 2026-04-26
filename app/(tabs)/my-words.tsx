import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';

const COLORS = {
  bg: '#2a2424',
  surface: '#393232',
  elevated: '#4d4545',
  accent: '#8d6262',
  highlight: '#ed8d8d',
  text: '#f5eded',
  textMuted: '#b89898',
  textDim: '#7a6464',
  border: '#5a4d4d',
};

interface Definition {
  definition: string;
  example?: string;
  synonyms: string[];
}

interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
}

interface Phonetic {
  text?: string;
  audio?: string;
}

interface WordEntry {
  word: string;
  phonetic?: string;
  phonetics: Phonetic[];
  meanings: Meaning[];
}

const partOfSpeechColor: Record<string, string> = {
  noun: '#ed8d8d',
  verb: '#c4a0a0',
  adjective: '#a08080',
  adverb: '#b89090',
  interjection: '#d4a0a0',
  pronoun: '#c09090',
  preposition: '#b08080',
  conjunction: '#c8a8a8',
};

function WordDetailModal({
  entry,
  onClose,
  onRemove,
}: {
  entry: WordEntry;
  onClose: () => void;
  onRemove: () => void;
}) {
  const phonetic =
    entry.phonetic ||
    entry.phonetics.find((p) => p.text)?.text ||
    '';

  const audioUrl = entry.phonetics.find((p) => p.audio && p.audio.length > 0)?.audio;

  const player = useAudioPlayer(null as any);

  const playAudio = () => {
    if (!audioUrl) return;
    try {
      player.replace({ uri: audioUrl });
      player.play();
    } catch {}
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHandle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Word Header */}
            <View style={styles.wordHeader}>
              <View style={styles.wordTitleRow}>
                <Text style={styles.wordTitle}>{entry.word}</Text>
                {audioUrl && (
                  <TouchableOpacity
                    style={styles.audioBtn}
                    onPress={playAudio}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.audioBtnText}>♪</Text>
                  </TouchableOpacity>
                )}
              </View>
              {phonetic ? <Text style={styles.phonetic}>{phonetic}</Text> : null}
            </View>

            <View style={styles.divider} />

            {/* Meanings */}
            {entry.meanings.map((meaning, mi) => (
              <View key={mi} style={styles.meaningBlock}>
                <View
                  style={[
                    styles.posTag,
                    {
                      backgroundColor:
                        (partOfSpeechColor[meaning.partOfSpeech] || COLORS.accent) + '22',
                      borderColor:
                        partOfSpeechColor[meaning.partOfSpeech] || COLORS.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.posText,
                      {
                        color:
                          partOfSpeechColor[meaning.partOfSpeech] || COLORS.accent,
                      },
                    ]}
                  >
                    {meaning.partOfSpeech}
                  </Text>
                </View>

                {meaning.definitions.slice(0, 3).map((def, di) => (
                  <View key={di} style={styles.defItem}>
                    <Text style={styles.defNumber}>{di + 1}</Text>
                    <View style={styles.defContent}>
                      <Text style={styles.defText}>{def.definition}</Text>
                      {def.example ? (
                        <Text style={styles.defExample}>"{def.example}"</Text>
                      ) : null}
                    </View>
                  </View>
                ))}

                {meaning.definitions[0]?.synonyms?.length > 0 && (
                  <View style={styles.synRow}>
                    <Text style={styles.synLabel}>syn: </Text>
                    <Text style={styles.synWords}>
                      {meaning.definitions[0].synonyms.slice(0, 4).join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {/* Remove Button */}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={onRemove}
              activeOpacity={0.8}
            >
              <Text style={styles.removeBtnText}>✕ remove from my words</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeBtnText}>close</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function MyWordsScreen() {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [selected, setSelected] = useState<WordEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadWords();
    }, [])
  );

  const loadWords = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedWords');
      setWords(saved ? JSON.parse(saved) : []);
    } catch {}
  };

  const removeWord = async (word: string) => {
    try {
      const updated = words.filter((w) => w.word !== word);
      await AsyncStorage.setItem('savedWords', JSON.stringify(updated));
      setWords(updated);
      setSelected(null);
    } catch {}
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>my words</Text>
          <Text style={styles.headerCount}>
            {words.length} {words.length === 1 ? 'word' : 'words'} saved
          </Text>
        </View>

        {words.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◇</Text>
            <Text style={styles.emptyText}>
              no words saved yet{'\n'}search and add words to study them
            </Text>
          </View>
        ) : (
          <View style={styles.wordList}>
            {words.map((entry, i) => {
              const phonetic =
                entry.phonetic ||
                entry.phonetics.find((p) => p.text)?.text ||
                '';
              const pos = entry.meanings[0]?.partOfSpeech || '';
              const def = entry.meanings[0]?.definitions[0]?.definition || '';

              return (
                <TouchableOpacity
                  key={entry.word + i}
                  style={styles.wordRow}
                  onPress={() => setSelected(entry)}
                  activeOpacity={0.75}
                >
                  <View style={styles.wordRowLeft}>
                    <View style={styles.wordRowTop}>
                      <Text style={styles.rowWord}>{entry.word}</Text>
                      {phonetic ? (
                        <Text style={styles.rowPhonetic}>{phonetic}</Text>
                      ) : null}
                    </View>
                    {pos ? (
                      <Text
                        style={[
                          styles.rowPos,
                          { color: partOfSpeechColor[pos] || COLORS.accent },
                        ]}
                      >
                        {pos}
                      </Text>
                    ) : null}
                    {def ? (
                      <Text style={styles.rowDef} numberOfLines={2}>
                        {def}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.rowArrow}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {selected && (
        <WordDetailModal
          entry={selected}
          onClose={() => setSelected(null)}
          onRemove={() => removeWord(selected.word)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 36,
    color: COLORS.highlight,
    fontWeight: '400',
    letterSpacing: 2,
  },
  headerCount: {
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 40,
    color: COLORS.elevated,
  },
  emptyText: {
    color: COLORS.textDim,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  wordList: {
    gap: 10,
  },
  wordRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.elevated,
    gap: 12,
  },
  wordRowLeft: {
    flex: 1,
    gap: 4,
  },
  wordRowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  rowWord: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 22,
    color: COLORS.text,
    fontWeight: '400',
  },
  rowPhonetic: {
    fontSize: 13,
    color: COLORS.accent,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  rowPos: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rowDef: {
    fontSize: 13,
    color: COLORS.textDim,
    lineHeight: 18,
  },
  rowArrow: {
    fontSize: 22,
    color: COLORS.textDim,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,20,20,0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 12,
    maxHeight: '90%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.elevated,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.elevated,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  wordHeader: {
    marginBottom: 16,
  },
  wordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wordTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 36,
    color: COLORS.text,
    fontWeight: '400',
    letterSpacing: 1,
  },
  audioBtn: {
    backgroundColor: COLORS.elevated,
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBtnText: {
    fontSize: 18,
    color: COLORS.highlight,
  },
  phonetic: {
    fontSize: 16,
    color: COLORS.accent,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.elevated,
    marginBottom: 16,
  },
  meaningBlock: {
    marginBottom: 20,
  },
  posTag: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    marginBottom: 12,
  },
  posText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  defItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  defNumber: {
    fontSize: 11,
    color: COLORS.textDim,
    width: 16,
    paddingTop: 2,
    fontWeight: '700',
  },
  defContent: {
    flex: 1,
    gap: 4,
  },
  defText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  defExample: {
    fontSize: 13,
    color: COLORS.textDim,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  synRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    paddingLeft: 28,
  },
  synLabel: {
    fontSize: 13,
    color: COLORS.textDim,
    fontStyle: 'italic',
  },
  synWords: {
    fontSize: 13,
    color: COLORS.accent,
  },
  removeBtn: {
    backgroundColor: COLORS.elevated,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  removeBtnText: {
    fontSize: 14,
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  closeBtnText: {
    fontSize: 14,
    color: COLORS.textDim,
    letterSpacing: 1,
  },
});
