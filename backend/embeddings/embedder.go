package embeddings

import (
	"context"
	"fmt"

	openai "github.com/sashabaranov/go-openai"
)

// Embedder generates vector embeddings using OpenAI.
type Embedder struct {
	client *openai.Client
	model  openai.EmbeddingModel
}

// NewEmbedder creates an embedder with the given API key and model name.
func NewEmbedder(apiKey string, model string) *Embedder {
	client := openai.NewClient(apiKey)
	return &Embedder{
		client: client,
		model:  openai.EmbeddingModel(model),
	}
}

// Embed generates a single embedding vector for the given text.
func (e *Embedder) Embed(ctx context.Context, text string) ([]float32, error) {
	resp, err := e.client.CreateEmbeddings(ctx, openai.EmbeddingRequest{
		Model: e.model,
		Input: []string{text},
	})
	if err != nil {
		return nil, fmt.Errorf("embedding request failed: %w", err)
	}

	if len(resp.Data) == 0 {
		return nil, fmt.Errorf("no embedding returned")
	}

	return resp.Data[0].Embedding, nil
}

// EmbedBatch generates embeddings for multiple texts in a single request.
func (e *Embedder) EmbedBatch(ctx context.Context, texts []string) ([][]float32, error) {
	if len(texts) == 0 {
		return nil, nil
	}

	resp, err := e.client.CreateEmbeddings(ctx, openai.EmbeddingRequest{
		Model: e.model,
		Input: texts,
	})
	if err != nil {
		return nil, fmt.Errorf("batch embedding request failed: %w", err)
	}

	results := make([][]float32, len(resp.Data))
	for i, d := range resp.Data {
		results[i] = d.Embedding
	}

	return results, nil
}
