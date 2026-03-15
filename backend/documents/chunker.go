package documents

import (
	"strings"
	"unicode"
)

// SplitTextIntoChunks splits text into overlapping chunks.
// size is the target number of tokens per chunk.
// overlap is the number of overlapping tokens between consecutive chunks.
// We approximate tokens as whitespace-separated words.
func SplitTextIntoChunks(text string, size int, overlap int) []string {
	// Normalize whitespace
	text = strings.Join(strings.FieldsFunc(text, func(r rune) bool {
		return unicode.IsSpace(r)
	}), " ")

	words := strings.Fields(text)
	if len(words) == 0 {
		return nil
	}

	if size <= 0 {
		size = 512
	}
	if overlap < 0 || overlap >= size {
		overlap = 0
	}

	var chunks []string
	step := size - overlap

	for i := 0; i < len(words); i += step {
		end := i + size
		if end > len(words) {
			end = len(words)
		}

		chunk := strings.Join(words[i:end], " ")
		chunk = strings.TrimSpace(chunk)
		if chunk != "" {
			chunks = append(chunks, chunk)
		}

		// If we've reached the end, stop
		if end == len(words) {
			break
		}
	}

	return chunks
}
