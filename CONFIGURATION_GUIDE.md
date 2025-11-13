# Module Configuration Guide

This guide explains how to configure and customize your platform using the admin module configurator.

## Accessing the Module Configurator

1. Log in as an **admin** user
2. Navigate to the Dashboard
3. Click on "Configure Modules" in the Admin Tools section
4. You'll be taken to `/admin/modules`

## Configuration Tabs

### 1. Modules Tab

This tab allows you to enable/disable entire modules and their features.

#### How to Enable/Disable a Module

1. Find the module in the list
2. Click the checkbox next to "Enabled/Disabled"
3. When enabled, you'll see all available features for that module

#### How to Configure Module Features

1. Ensure the module is enabled
2. Scroll through the feature list below the module header
3. Check/uncheck individual features
4. Features are applied immediately upon saving

#### Module List

**Authentication**
- Controls user registration, login, password recovery
- Enable social login for OAuth providers
- Toggle two-factor authentication

**Communication**
- Enable/disable messaging, chat, notifications
- Configure real-time features
- Control notification channels (email, push, in-app)

**User Management**
- Control which user types can be created
- Enable friend connections
- Configure role and permission systems

**Dashboard**
- Enable widget system
- Allow customizable layouts
- Show activity feeds

**UI Customization**
- Allow users to change themes
- Enable custom branding
- Control layout options

**Assessment & Intake**
- Enable general intake forms
- Activate form builder
- Control assessment types

**VI-SPDAT**
- Enable vulnerability assessments
- Choose assessment types (individual, family, youth)
- Enable automatic scoring

**Homelessness Outreach**
- Enable client tracking
- Activate location mapping
- Configure resource directory

**Addiction Tools**
- Enable substance use assessments
- Activate recovery planning
- Configure support group features

**Mental Health**
- Enable diagnostic tools
- Activate treatment planning
- Configure medication tracking

**Shelter Management**
- Enable bed management
- Activate check-in/out system
- Configure occupancy tracking

**Case Management**
- Enable case tracking
- Activate goal setting
- Configure team collaboration

**Incident Reporting**
- Enable incident logging
- Configure severity levels
- Activate photo attachments

**Resource Sharing**
- Enable resource library
- Configure access controls
- Activate version control

**Settings**
- Control available user settings
- Enable data export
- Configure API access

**Consent Management**
- Enable consent tracking
- Activate digital signatures
- Configure audit logging

**Badges**
- Enable achievement system
- Configure badge types
- Activate leaderboards

### 2. Branding Tab

Customize the look and feel of your platform.

#### Company Name
- Change the organization name displayed throughout the app
- Appears in login screens, headers, and emails

#### Logo URL
- Provide a URL to your organization's logo
- Recommended size: 200x60 pixels
- Formats: PNG, SVG, JPG
- Example: `https://example.com/logo.png`

#### Color Scheme

**Primary Color**
- Main brand color
- Used for buttons, links, highlights
- Default: `#2563eb` (blue)

**Secondary Color**
- Supporting brand color
- Used for secondary elements
- Default: `#7c3aed` (purple)

**Accent Color**
- Accent highlights
- Used for success states, notifications
- Default: `#10b981` (green)

#### Custom CSS
- Add custom CSS for advanced styling
- Applied globally across the platform
- Requires CSS knowledge

### 3. Layout Tab

Configure the overall layout of the platform.

#### Sidebar Position
- **Left** (default): Sidebar on the left side
- **Right**: Sidebar on the right side

#### Header Style
- **Fixed** (default): Header stays at top when scrolling
- **Static**: Header scrolls with content

#### Footer
- **Enabled**: Show footer at bottom of pages
- **Disabled**: Hide footer

#### Compact Mode
- **Enabled**: Reduced padding and spacing
- **Disabled**: Standard spacing (default)

## Saving Configuration

1. Make your desired changes in any tab
2. Scroll to the bottom of the page
3. Click "Save Configuration"
4. Wait for confirmation message
5. Changes are applied immediately

## Best Practices

### Starting Fresh
If setting up a new organization:
1. Start with all modules disabled
2. Enable only the modules you need
3. Configure features one module at a time
4. Test each module before moving to the next

### Minimal Configuration
For a basic setup, enable:
- Authentication (all features)
- User Management (basic features)
- Dashboard (all features)
- Settings (all features)

### Full-Featured Setup
For comprehensive functionality:
- Enable all modules
- Configure branding
- Set up custom layouts
- Enable all features within each module

### Security Considerations
- Disable unused modules to reduce attack surface
- Restrict API access unless needed
- Enable two-factor authentication for sensitive applications
- Regular review of enabled features

### Performance Optimization
- Disable real-time features if not needed
- Limit video chat to specific users
- Disable animations on slower devices
- Use compact mode for mobile users

## Module Dependencies

Some features depend on others being enabled:

**Case Management** requires:
- User Management (for assigning cases)
- Communication (for team collaboration)

**Incident Reporting** may use:
- Case Management (for linking incidents)
- User Management (for assignments)

**Real-time Chat** requires:
- Communication module enabled
- WebSocket support in browser

**Video Chat** requires:
- Communication module enabled
- Real-time chat enabled
- WebRTC support in browser

## Troubleshooting

### Changes Not Appearing
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Log out and log back in

### Module Not Working
- Ensure module is enabled
- Check that required features are enabled
- Verify user has appropriate role permissions

### Branding Not Updating
- Check logo URL is publicly accessible
- Verify image format is supported
- Clear cache and refresh

### Layout Issues
- Try disabling custom CSS
- Reset to default layout settings
- Check browser compatibility

## API Configuration

Module configuration can also be managed via API:

```bash
# Get current configuration
GET /api/modules

# Update configuration
PUT /api/modules

# Update specific module
PATCH /api/modules/:moduleName

# Update branding
PATCH /api/modules/branding

# Update layout
PATCH /api/modules/layout
```

All configuration endpoints require admin authentication.

## Export/Import Configuration

To backup or transfer configuration:

1. Save current configuration to file
2. Edit JSON file as needed
3. Import via API or admin panel
4. Verify all modules working correctly

## Support

For additional help:
- Refer to README.md for technical details
- Check FEATURES.md for complete feature list
- Review API documentation for integration
- Contact system administrator for access issues
