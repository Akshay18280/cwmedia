package embeddings

import (
	"context"
	"crypto/sha256"
	"encoding/binary"
	"math"
	"strings"
	"unicode"
)

// Embedder generates vector embeddings locally using a deterministic
// hash-based approach. No external API required.
// For higher quality, swap in Voyage AI or OpenAI embeddings.
type Embedder struct {
	dim int
}

// NewEmbedder creates a local embedder producing vectors of the given dimension.
func NewEmbedder(dim int) *Embedder {
	if dim <= 0 {
		dim = 512
	}
	return &Embedder{dim: dim}
}

// Embed generates a single embedding vector for the given text.
func (e *Embedder) Embed(_ context.Context, text string) ([]float32, error) {
	return e.generate(text), nil
}

// EmbedBatch generates embeddings for multiple texts.
func (e *Embedder) EmbedBatch(_ context.Context, texts []string) ([][]float32, error) {
	results := make([][]float32, len(texts))
	for i, t := range texts {
		results[i] = e.generate(t)
	}
	return results, nil
}

// generate produces a deterministic embedding for text using overlapping
// character n-gram hashing projected into the target dimension space.
// This captures word-level and phrase-level patterns sufficient for
// cosine-similarity retrieval over chunked documents.
func (e *Embedder) generate(text string) []float32 {
	// Normalize text
	text = strings.ToLower(text)
	words := tokenize(text)

	vec := make([]float64, e.dim)

	// Hash individual words (unigrams)
	for _, w := range words {
		addHash(vec, w, 1.0)
	}

	// Hash word bigrams for phrase-level signal
	for i := 0; i < len(words)-1; i++ {
		bigram := words[i] + " " + words[i+1]
		addHash(vec, bigram, 0.7)
	}

	// Hash character trigrams for subword matching
	for _, w := range words {
		padded := "#" + w + "#"
		for i := 0; i <= len(padded)-3; i++ {
			trigram := padded[i : i+3]
			addHash(vec, trigram, 0.3)
		}
	}

	// L2-normalize so cosine distance works correctly
	normalize(vec)

	// Convert to float32
	result := make([]float32, e.dim)
	for i, v := range vec {
		result[i] = float32(v)
	}

	return result
}

// tokenize splits text into lowercase words, filtering short/stop words.
func tokenize(text string) []string {
	raw := strings.FieldsFunc(text, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsDigit(r)
	})
	words := make([]string, 0, len(raw))
	for _, w := range raw {
		if len(w) >= 2 {
			words = append(words, w)
		}
	}
	return words
}

// addHash deterministically maps a token to positions in the vector.
func addHash(vec []float64, token string, weight float64) {
	h := sha256.Sum256([]byte(token))
	dim := len(vec)

	// Use multiple hash slices to spread the signal
	for offset := 0; offset+4 <= len(h); offset += 4 {
		idx := int(binary.LittleEndian.Uint32(h[offset:])) % dim
		// Alternate positive/negative to create balanced vectors
		if h[offset]&1 == 0 {
			vec[idx] += weight
		} else {
			vec[idx] -= weight
		}
	}
}

// normalize applies L2 normalization to a vector.
func normalize(vec []float64) {
	var sum float64
	for _, v := range vec {
		sum += v * v
	}
	if sum == 0 {
		return
	}
	norm := math.Sqrt(sum)
	for i := range vec {
		vec[i] /= norm
	}
}
