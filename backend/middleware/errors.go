package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIError is the standard error response format.
type APIError struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) > 0 {
			err := c.Errors.Last()
			log.Printf("API error: %v", err.Err)
			c.JSON(http.StatusInternalServerError, APIError{
				Error:   "internal_error",
				Message: err.Error(),
			})
		}
	}
}

// RespondError sends a structured error response.
func RespondError(c *gin.Context, status int, code string, message string) {
	c.JSON(status, APIError{
		Error:   code,
		Message: message,
	})
}
