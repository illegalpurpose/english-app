import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const COLORS = {
    bg: "#2a2424",
    surface: "#393232",
    elevated: "#4d4545",
    accent: "#8d6262",
    highlight: "#ed8d8d",
    text: "#f5eded",
    textMuted: "#b89898",
    textDim: "#7a6464",
    border: "#5a4d4d",
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
    noun: "#ed8d8d",
    verb: "#c4a0a0",
    adjective: "#a08080",
    adverb: "#b89090",
    interjection: "#d4a0a0",
    pronoun: "#c09090",
    preposition: "#b08080",
    conjunction: "#c8a8a8",
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
        entry.phonetic || entry.phonetics.find((p) => p.text)?.text || "";

    const audioUrl = entry.phonetics.find(
        (p) => p.audio && p.audio.length > 0,
    )?.audio;

    const player = useAudioPlayer(null as any);

    const playAudio = () => {
        if (!audioUrl) return;
        try {
            player.replace({ uri: audioUrl });
            player.play();
        } catch {}
    };

    return (
        <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalSheet}>
                    <View style={styles.modalHandle} />

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
                        {phonetic ? (
                            <Text style={styles.phonetic}>{phonetic}</Text>
                        ) : null}
                    </View>

                    <View style={styles.divider} />
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1 }}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                        scrollEnabled={true}
                    >
                        {/* Meanings */}
                        {entry.meanings.map((meaning, mi) => (
                            <View key={mi} style={styles.meaningBlock}>
                                <View
                                    style={[
                                        styles.posTag,
                                        {
                                            backgroundColor:
                                                (partOfSpeechColor[
                                                    meaning.partOfSpeech
                                                ] || COLORS.accent) + "22",
                                            borderColor:
                                                partOfSpeechColor[
                                                    meaning.partOfSpeech
                                                ] || COLORS.accent,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.posText,
                                            {
                                                color:
                                                    partOfSpeechColor[
                                                        meaning.partOfSpeech
                                                    ] || COLORS.accent,
                                            },
                                        ]}
                                    >
                                        {meaning.partOfSpeech}
                                    </Text>
                                </View>

                                {meaning.definitions.map((def, di) => (
                                    <View key={di} style={styles.defItem}>
                                        <Text style={styles.defNumber}>
                                            {di + 1}
                                        </Text>
                                        <View style={styles.defContent}>
                                            <Text style={styles.defText}>
                                                {def.definition}
                                            </Text>
                                            {def.example ? (
                                                <Text style={styles.defExample}>
                                                    "{def.example}"
                                                </Text>
                                            ) : null}
                                        </View>
                                    </View>
                                ))}

                                {meaning.definitions[0]?.synonyms?.length >
                                    0 && (
                                    <View style={styles.synRow}>
                                        <Text style={styles.synLabel}>
                                            syn:{" "}
                                        </Text>
                                        <Text style={styles.synWords}>
                                            {meaning.definitions[0].synonyms.join(
                                                ", ",
                                            )}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                    {/* Remove Button */}
                    <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={onRemove}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.removeBtnText}>
                            ✕ remove from my words
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.closeBtnText}>close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

export default function MyWordsScreen() {
    const [words, setWords] = useState<WordEntry[]>([]);
    const [selected, setSelected] = useState<WordEntry | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadWords();
        }, []),
    );

    const loadWords = async () => {
        try {
            const saved = await AsyncStorage.getItem("savedWords");
            setWords(saved ? JSON.parse(saved) : []);
        } catch {}
    };

    const removeWord = async (word: string) => {
        try {
            const updated = words.filter((w) => w.word !== word);
            await AsyncStorage.setItem("savedWords", JSON.stringify(updated));
            setWords(updated);
            setSelected(null);
        } catch {}
    };

    const exportWords = async () => {
        try {
            const wordList = words.map((w) => w.word).join("\n");

            await Share.share({
                message: wordList,
                title: "My Words List",
                url: undefined,
            });
        } catch (error) {
            console.error("Export error:", error);
        }
    };

    const importWords = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "text/plain",
            });

            if (result.canceled) return;

            const file = result.assets[0];
            if (!file.uri) return;

            const fileContent = await fetch(file.uri);
            const text = await fileContent.text();

            const wordNames = text
                .split("\n")
                .map((w) => w.trim())
                .filter((w) => w.length > 0);

            if (wordNames.length === 0) {
                Alert.alert(
                    "Empty file",
                    "No words found in the selected file.",
                );
                return;
            }

            let addedCount = 0;
            const existingWords = words.map((w) => w.word.toLowerCase());

            for (const wordName of wordNames) {
                if (existingWords.includes(wordName.toLowerCase())) {
                    continue;
                }

                try {
                    const res = await fetch(
                        `https://api.dictionaryapi.dev/api/v2/entries/en/${wordName}`,
                    );
                    if (!res.ok) continue;

                    const data: WordEntry[] = await res.json();
                    if (data.length > 0) {
                        words.push(data[0]);
                        addedCount++;
                    }
                } catch {}
            }

            await AsyncStorage.setItem("savedWords", JSON.stringify(words));
            setWords([...words]);

            Alert.alert(
                "Import successful",
                `${addedCount} words were added to your collection.`,
            );
        } catch (error) {
            console.error("Import error:", error);
            Alert.alert("Import error", "Failed to import words from file.");
        }
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
                        {words.length} {words.length === 1 ? "word" : "words"}{" "}
                        saved
                    </Text>
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={exportWords}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.actionBtnText}>↓ export</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={importWords}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.actionBtnText}>↑ import</Text>
                    </TouchableOpacity>
                </View>

                {words.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>◇</Text>
                        <Text style={styles.emptyText}>
                            no words saved yet{"\n"}search and add words to
                            study them
                        </Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.wordList}>
                            {words.map((entry, i) => {
                                const phonetic =
                                    entry.phonetic ||
                                    entry.phonetics.find((p) => p.text)?.text ||
                                    "";
                                const pos =
                                    entry.meanings[0]?.partOfSpeech || "";
                                const def =
                                    entry.meanings[0]?.definitions[0]
                                        ?.definition || "";

                                return (
                                    <TouchableOpacity
                                        key={entry.word + i}
                                        style={styles.wordRow}
                                        onPress={() => setSelected(entry)}
                                        activeOpacity={0.75}
                                    >
                                        <View style={styles.wordRowLeft}>
                                            <View style={styles.wordRowTop}>
                                                <Text style={styles.rowWord}>
                                                    {entry.word}
                                                </Text>
                                                {phonetic ? (
                                                    <Text
                                                        style={
                                                            styles.rowPhonetic
                                                        }
                                                    >
                                                        {phonetic}
                                                    </Text>
                                                ) : null}
                                            </View>
                                            {pos ? (
                                                <Text
                                                    style={[
                                                        styles.rowPos,
                                                        {
                                                            color:
                                                                partOfSpeechColor[
                                                                    pos
                                                                ] ||
                                                                COLORS.accent,
                                                        },
                                                    ]}
                                                >
                                                    {pos}
                                                </Text>
                                            ) : null}
                                            {def ? (
                                                <Text
                                                    style={styles.rowDef}
                                                    numberOfLines={2}
                                                >
                                                    {def}
                                                </Text>
                                            ) : null}
                                        </View>
                                        <Text style={styles.rowArrow}>›</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
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
        paddingTop: Platform.OS === "ios" ? 60 : 40,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    headerTitle: {
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
        fontSize: 40,
        color: COLORS.highlight,
        fontWeight: "400",
        letterSpacing: 2,
    },
    headerCount: {
        fontSize: 14,
        color: COLORS.textDim,
        marginTop: 4,
        letterSpacing: 0.5,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: COLORS.highlight,
        borderRadius: 16,
        padding: 14,
        alignItems: "center",
    },
    actionBtnText: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.surface,
        letterSpacing: 0.5,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 80,
        gap: 12,
    },
    emptyIcon: {
        fontSize: 40,
        color: COLORS.elevated,
    },
    emptyText: {
        color: COLORS.textDim,
        fontSize: 16,
        textAlign: "center",
        lineHeight: 24,
    },
    wordList: {
        gap: 10,
    },
    wordRow: {
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.elevated,
        gap: 12,
    },
    wordRowLeft: {
        flex: 1,
        gap: 6,
    },
    wordRowTop: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 8,
        flexWrap: "wrap",
    },
    rowWord: {
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
        fontSize: 24,
        color: COLORS.text,
        fontWeight: "400",
    },
    rowPhonetic: {
        fontSize: 14,
        color: COLORS.accent,
        fontStyle: "italic",
        fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    },
    rowPos: {
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    rowDef: {
        fontSize: 14,
        color: COLORS.textDim,
        lineHeight: 20,
    },
    rowArrow: {
        fontSize: 22,
        color: COLORS.textDim,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(26,20,20,0.85)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingTop: 12,
        maxHeight: "85%",
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: COLORS.elevated,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.elevated,
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 20,
    },
    wordHeader: {
        marginBottom: 16,
    },
    wordTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    wordTitle: {
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
        fontSize: 40,
        color: COLORS.text,
        fontWeight: "400",
        letterSpacing: 1,
    },
    audioBtn: {
        backgroundColor: COLORS.elevated,
        borderRadius: 12,
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    audioBtnText: {
        fontSize: 18,
        color: COLORS.highlight,
    },
    phonetic: {
        fontSize: 18,
        color: COLORS.accent,
        marginTop: 4,
        fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
        fontStyle: "italic",
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
        alignSelf: "flex-start",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderWidth: 1,
        marginBottom: 12,
    },
    posText: {
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    defItem: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    defNumber: {
        fontSize: 12,
        color: COLORS.textDim,
        width: 16,
        paddingTop: 2,
        fontWeight: "700",
    },
    defContent: {
        flex: 1,
        gap: 6,
    },
    defText: {
        fontSize: 16,
        color: COLORS.text,
        lineHeight: 24,
    },
    defExample: {
        fontSize: 14,
        color: COLORS.textDim,
        fontStyle: "italic",
        lineHeight: 21,
    },
    synRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 8,
        paddingLeft: 28,
    },
    synLabel: {
        fontSize: 14,
        color: COLORS.textDim,
        fontStyle: "italic",
    },
    synWords: {
        fontSize: 14,
        color: COLORS.accent,
    },
    removeBtn: {
        backgroundColor: COLORS.elevated,
        borderRadius: 16,
        padding: 14,
        alignItems: "center",
        marginTop: 12,
        borderWidth: 1,
        borderColor: COLORS.accent,
    },
    removeBtnText: {
        fontSize: 15,
        color: COLORS.accent,
        letterSpacing: 0.5,
    },
    closeBtn: {
        padding: 14,
        alignItems: "center",
        marginTop: 12,
    },
    closeBtnText: {
        fontSize: 15,
        color: COLORS.textDim,
        letterSpacing: 1,
    },
});
