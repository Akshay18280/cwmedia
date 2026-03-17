package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// FinancialDataService fetches live financial data from public APIs.
type FinancialDataService struct {
	client *http.Client
}

// NewFinancialDataService creates the financial data service.
func NewFinancialDataService() *FinancialDataService {
	return &FinancialDataService{
		client: &http.Client{Timeout: 15 * time.Second},
	}
}

// StockQuote represents real-time stock data.
type StockQuote struct {
	Symbol           string  `json:"symbol"`
	ShortName        string  `json:"shortName"`
	LongName         string  `json:"longName"`
	RegularPrice     float64 `json:"regularMarketPrice"`
	PreviousClose    float64 `json:"regularMarketPreviousClose"`
	MarketCap        float64 `json:"marketCap"`
	TrailingPE       float64 `json:"trailingPE"`
	ForwardPE        float64 `json:"forwardPE"`
	DividendYield    float64 `json:"dividendYield"`
	FiftyTwoWeekHigh float64 `json:"fiftyTwoWeekHigh"`
	FiftyTwoWeekLow  float64 `json:"fiftyTwoWeekLow"`
	Revenue          float64 `json:"totalRevenue"`
	GrossProfit      float64 `json:"grossProfits"`
	EBITDA           float64 `json:"ebitda"`
	ProfitMargin     float64 `json:"profitMargins"`
	RevenueGrowth    float64 `json:"revenueGrowth"`
	Currency         string  `json:"currency"`
	Exchange         string  `json:"exchange"`
}

// FetchQuote fetches a stock quote for the given ticker symbol using the Yahoo Finance v8 API.
func (f *FinancialDataService) FetchQuote(ctx context.Context, ticker string) (*StockQuote, error) {
	ticker = strings.ToUpper(strings.TrimSpace(ticker))
	if ticker == "" {
		return nil, fmt.Errorf("empty ticker symbol")
	}

	apiURL := fmt.Sprintf("https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1d&range=5d", url.PathEscape(ticker))

	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; CWMedia-Research/1.0)")

	resp, err := f.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("yahoo finance request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read yahoo finance response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("yahoo finance error (status %d): %s", resp.StatusCode, string(body[:min(200, len(body))]))
	}

	// Parse the chart response to extract meta and indicators
	var chartResp struct {
		Chart struct {
			Result []struct {
				Meta struct {
					Symbol             string  `json:"symbol"`
					ShortName          string  `json:"shortName"`
					LongName           string  `json:"longName"`
					Currency           string  `json:"currency"`
					Exchange           string  `json:"exchangeName"`
					RegularMarketPrice float64 `json:"regularMarketPrice"`
					PreviousClose      float64 `json:"previousClose"`
					FiftyTwoWeekHigh   float64 `json:"fiftyTwoWeekHigh"`
					FiftyTwoWeekLow    float64 `json:"fiftyTwoWeekLow"`
				} `json:"meta"`
			} `json:"result"`
			Error *struct {
				Code        string `json:"code"`
				Description string `json:"description"`
			} `json:"error"`
		} `json:"chart"`
	}

	if err := json.Unmarshal(body, &chartResp); err != nil {
		return nil, fmt.Errorf("parse yahoo finance response: %w", err)
	}

	if chartResp.Chart.Error != nil {
		return nil, fmt.Errorf("yahoo finance: %s", chartResp.Chart.Error.Description)
	}

	if len(chartResp.Chart.Result) == 0 {
		return nil, fmt.Errorf("no data found for ticker: %s", ticker)
	}

	meta := chartResp.Chart.Result[0].Meta
	quote := &StockQuote{
		Symbol:           meta.Symbol,
		ShortName:        meta.ShortName,
		LongName:         meta.LongName,
		RegularPrice:     meta.RegularMarketPrice,
		PreviousClose:    meta.PreviousClose,
		FiftyTwoWeekHigh: meta.FiftyTwoWeekHigh,
		FiftyTwoWeekLow:  meta.FiftyTwoWeekLow,
		Currency:         meta.Currency,
		Exchange:         meta.Exchange,
	}

	// Try to get summary data from a second call for fundamentals
	fundQuote, _ := f.fetchSummary(ctx, ticker)
	if fundQuote != nil {
		quote.MarketCap = fundQuote.MarketCap
		quote.TrailingPE = fundQuote.TrailingPE
		quote.ForwardPE = fundQuote.ForwardPE
		quote.DividendYield = fundQuote.DividendYield
		quote.Revenue = fundQuote.Revenue
		quote.GrossProfit = fundQuote.GrossProfit
		quote.EBITDA = fundQuote.EBITDA
		quote.ProfitMargin = fundQuote.ProfitMargin
		quote.RevenueGrowth = fundQuote.RevenueGrowth
		if quote.LongName == "" {
			quote.LongName = fundQuote.LongName
		}
	}

	return quote, nil
}

// fetchSummary gets fundamental data from Yahoo Finance quoteSummary endpoint.
func (f *FinancialDataService) fetchSummary(ctx context.Context, ticker string) (*StockQuote, error) {
	apiURL := fmt.Sprintf("https://query1.finance.yahoo.com/v10/finance/quoteSummary/%s?modules=financialData,defaultKeyStatistics,summaryProfile", url.PathEscape(ticker))

	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; CWMedia-Research/1.0)")

	resp, err := f.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("quoteSummary error (status %d)", resp.StatusCode)
	}

	// Parse the nested Yahoo response
	var summaryResp struct {
		QuoteSummary struct {
			Result []struct {
				FinancialData struct {
					TotalRevenue    yahooVal `json:"totalRevenue"`
					GrossProfit     yahooVal `json:"grossProfits"`
					EBITDA          yahooVal `json:"ebitda"`
					ProfitMargins   yahooVal `json:"profitMargins"`
					RevenueGrowth   yahooVal `json:"revenueGrowth"`
					CurrentPrice    yahooVal `json:"currentPrice"`
				} `json:"financialData"`
				DefaultKeyStatistics struct {
					EnterpriseValue yahooVal `json:"enterpriseValue"`
					ForwardPE       yahooVal `json:"forwardPE"`
					TrailingPE      yahooVal `json:"trailingEps"` // fallback
					MarketCap       yahooVal `json:"marketCap"`   // may not exist here
				} `json:"defaultKeyStatistics"`
				SummaryProfile struct {
					LongName string `json:"longName"`
				} `json:"summaryProfile"`
			} `json:"result"`
		} `json:"quoteSummary"`
	}

	if err := json.Unmarshal(body, &summaryResp); err != nil {
		return nil, err
	}

	if len(summaryResp.QuoteSummary.Result) == 0 {
		return nil, fmt.Errorf("no summary data")
	}

	r := summaryResp.QuoteSummary.Result[0]
	return &StockQuote{
		LongName:      r.SummaryProfile.LongName,
		Revenue:       r.FinancialData.TotalRevenue.Raw,
		GrossProfit:   r.FinancialData.GrossProfit.Raw,
		EBITDA:        r.FinancialData.EBITDA.Raw,
		ProfitMargin:  r.FinancialData.ProfitMargins.Raw,
		RevenueGrowth: r.FinancialData.RevenueGrowth.Raw,
		ForwardPE:     r.DefaultKeyStatistics.ForwardPE.Raw,
		MarketCap:     r.DefaultKeyStatistics.EnterpriseValue.Raw,
	}, nil
}

// yahooVal handles Yahoo Finance's {raw: 123, fmt: "$123"} format.
type yahooVal struct {
	Raw float64 `json:"raw"`
	Fmt string  `json:"fmt"`
}

// QuoteToFinancialMetrics converts a stock quote into report-ready metrics.
func QuoteToFinancialMetrics(q *StockQuote) []FinancialMetric {
	var metrics []FinancialMetric

	if q.RegularPrice > 0 {
		metrics = append(metrics, FinancialMetric{
			Label: "Stock Price", Value: q.RegularPrice, Unit: q.Currency, Category: "valuation",
		})
	}
	if q.MarketCap > 0 {
		metrics = append(metrics, FinancialMetric{
			Label: "Market Cap", Value: q.MarketCap / 1e9, Unit: "$B", Category: "valuation",
		})
	}
	if q.Revenue > 0 {
		metrics = append(metrics, FinancialMetric{
			Label: "Revenue", Value: q.Revenue / 1e9, Unit: "$B", Category: "revenue",
		})
	}
	if q.GrossProfit > 0 {
		metrics = append(metrics, FinancialMetric{
			Label: "Gross Profit", Value: q.GrossProfit / 1e9, Unit: "$B", Category: "profit",
		})
	}
	if q.EBITDA > 0 {
		metrics = append(metrics, FinancialMetric{
			Label: "EBITDA", Value: q.EBITDA / 1e9, Unit: "$B", Category: "profit",
		})
	}
	if q.ProfitMargin > 0 {
		metrics = append(metrics, FinancialMetric{
			Label: "Profit Margin", Value: q.ProfitMargin * 100, Unit: "%", Category: "profit",
		})
	}
	if q.RevenueGrowth != 0 {
		metrics = append(metrics, FinancialMetric{
			Label: "Revenue Growth", Value: q.RevenueGrowth * 100, Unit: "%", Category: "growth",
		})
	}
	if q.TrailingPE > 0 {
		metrics = append(metrics, FinancialMetric{
			Label: "Trailing P/E", Value: q.TrailingPE, Unit: "ratio", Category: "valuation",
		})
	}
	if q.ForwardPE > 0 {
		metrics = append(metrics, FinancialMetric{
			Label: "Forward P/E", Value: q.ForwardPE, Unit: "ratio", Category: "valuation",
		})
	}
	if q.FiftyTwoWeekHigh > 0 {
		metrics = append(metrics, FinancialMetric{
			Label: "52-Week High", Value: q.FiftyTwoWeekHigh, Unit: q.Currency, Category: "valuation",
		})
	}
	if q.FiftyTwoWeekLow > 0 {
		metrics = append(metrics, FinancialMetric{
			Label: "52-Week Low", Value: q.FiftyTwoWeekLow, Unit: q.Currency, Category: "valuation",
		})
	}
	if q.DividendYield > 0 {
		metrics = append(metrics, FinancialMetric{
			Label: "Dividend Yield", Value: q.DividendYield * 100, Unit: "%", Category: "valuation",
		})
	}

	return metrics
}

// DetectTicker tries to extract a stock ticker from the research query and company profile.
func DetectTicker(query string, profile *CompanyProfile) string {
	// If company profile has a ticker, use it
	if profile != nil && profile.StockTicker != "" {
		ticker := strings.TrimSpace(profile.StockTicker)
		ticker = strings.TrimPrefix(ticker, "$")
		if len(ticker) >= 1 && len(ticker) <= 5 {
			return strings.ToUpper(ticker)
		}
	}

	// Common company-to-ticker mappings
	tickerMap := map[string]string{
		"apple": "AAPL", "microsoft": "MSFT", "google": "GOOGL", "alphabet": "GOOGL",
		"amazon": "AMZN", "meta": "META", "facebook": "META", "tesla": "TSLA",
		"nvidia": "NVDA", "netflix": "NFLX", "amd": "AMD", "intel": "INTC",
		"salesforce": "CRM", "adobe": "ADBE", "oracle": "ORCL", "ibm": "IBM",
		"uber": "UBER", "spotify": "SPOT", "snap": "SNAP", "pinterest": "PINS",
		"shopify": "SHOP", "palantir": "PLTR", "snowflake": "SNOW", "datadog": "DDOG",
		"crowdstrike": "CRWD", "cloudflare": "NET", "twilio": "TWLO", "stripe": "STRIP",
		"openai": "", "anthropic": "", // private companies — no ticker
	}

	lower := strings.ToLower(query)
	for company, ticker := range tickerMap {
		if strings.Contains(lower, company) && ticker != "" {
			return ticker
		}
	}

	return ""
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
