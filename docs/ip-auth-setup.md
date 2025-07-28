# IP-Based Admin Authentication Setup

This feature allows automatic admin authentication based on the user's IP address, providing seamless access for trusted devices/networks without requiring email/password or OTP authentication.

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Enable or disable IP-based authentication
VITE_IP_AUTH_ENABLED=true

# Comma-separated list of allowed IP addresses for admin access
# Supports exact IPs and CIDR notation
VITE_ADMIN_ALLOWED_IPS=127.0.0.1,::1,192.168.1.0/24
```

### IP Address Formats

The system supports multiple IP address formats:

1. **Exact IP Match**
   ```
   127.0.0.1
   203.0.113.45
   ```

2. **CIDR Notation** (IP ranges)
   ```
   192.168.1.0/24    # Allows 192.168.1.1 to 192.168.1.254
   10.0.0.0/8        # Allows 10.0.0.1 to 10.255.255.254
   172.16.0.0/12     # Allows 172.16.0.1 to 172.31.255.254
   ```

3. **IPv6 Support**
   ```
   ::1               # IPv6 localhost
   2001:db8::/32     # IPv6 CIDR range
   ```

### Example Configurations

#### Home Office Setup
```env
VITE_IP_AUTH_ENABLED=true
VITE_ADMIN_ALLOWED_IPS=127.0.0.1,::1,192.168.1.0/24
```

#### Multiple Locations
```env
VITE_IP_AUTH_ENABLED=true
VITE_ADMIN_ALLOWED_IPS=127.0.0.1,203.0.113.45,198.51.100.0/24,192.168.1.0/24
```

#### Development Only
```env
VITE_IP_AUTH_ENABLED=true
VITE_ADMIN_ALLOWED_IPS=127.0.0.1,::1
```

## How It Works

1. **Automatic Detection**: When accessing the admin login page, the system automatically checks if the user's IP address is in the allowed list.

2. **Seamless Authentication**: If the IP is authorized, the user is automatically logged in as admin without any form inputs.

3. **Fallback Authentication**: If IP authentication fails, the regular email/password login form is displayed.

4. **Session Management**: IP-authenticated sessions are stored locally and persist for 24 hours.

## Security Considerations

### Best Practices

1. **Use Specific IP Ranges**: Avoid overly broad CIDR ranges like `0.0.0.0/0`
2. **Regular Review**: Periodically review and update allowed IP addresses
3. **Network Security**: Ensure your network is secure when using IP-based authentication
4. **Static IPs**: Use static IP addresses or stable network ranges

### Risks and Mitigations

- **IP Spoofing**: While difficult, IP addresses can potentially be spoofed
- **Shared Networks**: Be cautious with public or shared network IPs
- **Dynamic IPs**: Home internet IPs may change; use CIDR ranges for flexibility

## Runtime Configuration

You can also manage IP authentication at runtime:

### Check Current Configuration
```javascript
import { ipAuthService } from '../services/firebase/ip-auth.service';

const config = ipAuthService.getConfig();
console.log('IP Auth enabled:', config.enabled);
console.log('Allowed IPs:', config.allowedIPs);
```

### Add IP Address
```javascript
ipAuthService.addAllowedIP('203.0.113.45');
```

### Remove IP Address
```javascript
ipAuthService.removeAllowedIP('203.0.113.45');
```

### Enable/Disable IP Authentication
```javascript
ipAuthService.updateConfig({ enabled: false });
```

## Troubleshooting

### Common Issues

1. **IP Not Detected**
   - Check if external IP detection services are accessible
   - Verify network connectivity
   - Check browser console for errors

2. **IP Not Matching**
   - Verify your actual public IP address
   - Check CIDR notation syntax
   - Ensure environment variables are loaded correctly

3. **Authentication Not Working**
   - Confirm `VITE_IP_AUTH_ENABLED=true`
   - Check browser developer tools for console errors
   - Verify IP address format in configuration

### Getting Your IP Address

To find your current IP address for configuration:

1. **External IP**: Visit [whatismyipaddress.com](https://whatismyipaddress.com/)
2. **Local Network IP**: Use `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. **Browser Console**: The app will display your detected IP in browser console

### Debug Mode

Enable debug logging by opening browser console and checking IP authentication messages.

## Migration from Existing Authentication

IP-based authentication is additive and doesn't interfere with existing authentication methods:

- **Email/Password**: Still works as before
- **Phone OTP**: Continues to function normally
- **Google OAuth**: Remains unchanged

Users can still use traditional authentication methods even when IP authentication is enabled.

## Production Deployment

### Environment Setup

1. Set environment variables in your deployment platform
2. Configure allowed IP addresses for production environment
3. Test authentication flow before going live

### Monitoring

Monitor authentication logs to ensure:
- IP authentication is working correctly
- No unauthorized access attempts
- Session management is functioning properly

## Support

For issues with IP-based authentication:

1. Check browser console for error messages
2. Verify environment variable configuration
3. Test with a simple IP address first (like `127.0.0.1`)
4. Review network configuration and firewall settings 