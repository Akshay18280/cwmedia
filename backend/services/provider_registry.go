package services

import (
	"fmt"
	"sync"
)

// ModelInfo describes an available model for the frontend.
type ModelInfo struct {
	ID       string `json:"id"`
	Provider string `json:"provider"`
	Name     string `json:"name"`
	Tier     string `json:"tier"`
}

// ProviderRegistry maps model IDs to LLMProvider instances.
type ProviderRegistry struct {
	mu        sync.RWMutex
	providers map[string]LLMProvider
	models    map[string]ModelInfo
	defaultID string
}

// NewProviderRegistry creates a registry with a default model.
func NewProviderRegistry(defaultModel string) *ProviderRegistry {
	return &ProviderRegistry{
		providers: make(map[string]LLMProvider),
		models:    make(map[string]ModelInfo),
		defaultID: defaultModel,
	}
}

// Register adds a provider under the given model ID.
func (r *ProviderRegistry) Register(modelID, displayName, tier string, provider LLMProvider) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.providers[modelID] = provider
	r.models[modelID] = ModelInfo{
		ID:       modelID,
		Provider: provider.ProviderName(),
		Name:     displayName,
		Tier:     tier,
	}
}

// Get returns the provider for a model ID. Returns error if not found.
func (r *ProviderRegistry) Get(modelID string) (LLMProvider, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if p, ok := r.providers[modelID]; ok {
		return p, nil
	}
	return nil, fmt.Errorf("model %q not available — API key not configured or model unknown", modelID)
}

// GetOrDefault returns the provider for a model ID, falling back to default.
func (r *ProviderRegistry) GetOrDefault(modelID string) LLMProvider {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if p, ok := r.providers[modelID]; ok {
		return p
	}
	if p, ok := r.providers[r.defaultID]; ok {
		return p
	}
	// Return first registered provider as last resort
	for _, p := range r.providers {
		return p
	}
	return nil
}

// Default returns the default provider.
func (r *ProviderRegistry) Default() LLMProvider {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if p, ok := r.providers[r.defaultID]; ok {
		return p
	}
	for _, p := range r.providers {
		return p
	}
	return nil
}

// Count returns the number of registered models.
func (r *ProviderRegistry) Count() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.providers)
}

// ListModels returns all registered models.
func (r *ProviderRegistry) ListModels() []ModelInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]ModelInfo, 0, len(r.models))
	for _, m := range r.models {
		result = append(result, m)
	}
	return result
}
