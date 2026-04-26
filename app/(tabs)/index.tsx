import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  antonyms: string[];
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

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [wordData, setWordData] = useState<WordEntry[] | null>(null);
  const [error, setError] = useState('');
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const cardAnim = useRef(new Animated.Value(0)).current;

  const searchWord = async (word?: string) => {
    const searchTerm = (word || query).trim();
    if (!searchTerm) return;

    setLoading(true);
    setError('');
    setWordData(null);

    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${searchTerm}`
      );
      if (!res.ok) {
        setError(`No definition found for "${searchTerm}"`);
        setLoading(false);
        return;
      }
      const data: WordEntry[] = await res.json();
      setWordData(data);

      const saved = await AsyncStorage.getItem('savedWords');
      const list = saved ? JSON.parse(saved) : [];
      setSavedWords(list.map((w: any) => w.word));

      cardAnim.setValue(0);
      Animated.spring(cardAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const player = useAudioPlayer(null as any);

  const playAudio = (url: string) => {
    try {
      player.replace({ uri: url });
      player.play();
    } catch {}
  };

  const getAudioUrl = (data: WordEntry[]): string | null => {
    for (const entry of data) {
      for (const p of entry.phonetics) {
        if (p.audio && p.audio.length > 0) return p.audio;
      }
    }
    return null;
  };

  const getPhonetic = (data: WordEntry[]): string => {
    for (const entry of data) {
      if (entry.phonetic) return entry.phonetic;
      for (const p of entry.phonetics) {
        if (p.text) return p.text;
      }
    }
    return '';
  };

  const saveWord = async () => {
    if (!wordData) return;
    try {
      const saved = await AsyncStorage.getItem('savedWords');
      const list = saved ? JSON.parse(saved) : [];
      const exists = list.find((w: any) => w.word === wordData[0].word);
      if (exists) {
        Alert.alert('Already saved', `"${wordData[0].word}" is already in your words.`);
        return;
      }
      list.push(wordData[0]);
      await AsyncStorage.setItem('savedWords', JSON.stringify(list));
      setSavedWords((prev) => [...prev, wordData[0].word]);
      Alert.alert('Saved!', `"${wordData[0].word}" added to My Words.`);
    } catch {}
  };

  const isSaved = wordData ? savedWords.includes(wordData[0].word) : false;
  const audioUrl = wordData ? getAudioUrl(wordData) : null;
  const phonetic = wordData ? getPhonetic(wordData) : '';

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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>wordly</Text>
          <Text style={styles.tagline}>your pocket dictionary</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search a word..."
            placeholderTextColor={COLORS.textDim}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => searchWord()}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => searchWord()}
            activeOpacity={0.8}
          >
            <Text style={styles.searchBtnText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.centerState}>
            <ActivityIndicator color={COLORS.highlight} size="large" />
            <Text style={styles.loadingText}>looking it up...</Text>
          </View>
        )}

        {/* Error */}
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>✕</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Word Card */}
        {wordData && !loading && (
          <Animated.View
            style={[
              styles.wordCard,
              {
                opacity: cardAnim,
                transform: [
                  {
                    translateY: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Word Header */}
            <View style={styles.wordHeader}>
              <View style={styles.wordTitleRow}>
                <Text style={styles.wordTitle}>{wordData[0].word}</Text>
                {audioUrl && (
                  <TouchableOpacity
                    style={styles.audioBtn}
                    onPress={() => playAudio(audioUrl)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.audioBtnText}>♪</Text>
                  </TouchableOpacity>
                )}
              </View>
              {phonetic ? (
                <Text style={styles.phonetic}>{phonetic}</Text>
              ) : null}
            </View>

            <View style={styles.divider} />

            {/* Meanings */}
            {wordData.map((entry, ei) =>
              entry.meanings.map((meaning, mi) => (
                <View key={`${ei}-${mi}`} style={styles.meaningBlock}>
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
              ))
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, isSaved && styles.saveBtnSaved]}
              onPress={saveWord}
              activeOpacity={0.8}
              disabled={isSaved}
            >
              <Text style={[styles.saveBtnText, isSaved && styles.saveBtnTextSaved]}>
                {isSaved ? '✓ saved to my words' : '+ add to my words'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Empty state */}
        {!wordData && !loading && !error && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◈</Text>
            <Text style={styles.emptyText}>type a word above{'\n'}to explore its meaning</Text>
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 42,
    color: COLORS.highlight,
    fontWeight: '400',
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 12,
    color: COLORS.textDim,
    letterSpacing: 2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  searchBtn: {
    backgroundColor: COLORS.highlight,
    borderRadius: 16,
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    fontSize: 22,
    color: COLORS.surface,
    fontWeight: '700',
  },
  centerState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: COLORS.textDim,
    fontSize: 14,
    letterSpacing: 1,
  },
  errorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
    gap: 8,
  },
  errorIcon: {
    fontSize: 24,
    color: COLORS.accent,
  },
  errorText: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  wordCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.elevated,
    gap: 0,
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
  saveBtn: {
    backgroundColor: COLORS.highlight,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnSaved: {
    backgroundColor: COLORS.elevated,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.surface,
    letterSpacing: 0.5,
  },
  saveBtnTextSaved: {
    color: COLORS.textDim,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    letterSpacing: 0.3,
  },
});
