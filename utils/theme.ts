// Corporate Modern Theme
export const theme = {
    colors: {
      // Primary: Dark background
      primary: '#16181D',
      
      // Accent: Teal Blue
      accent: '#2FB8A8',
      accentHover: '#28A896',
      accentLight: '#4FC5B8',
      accentDark: '#259A8A',
      
      // Secondary Accent: Soft Gray
      secondary: '#AEB3B8',
      secondaryLight: '#C5C9CD',
      secondaryDark: '#8E9398',
      
      // Text Colors
      text: {
        primary: '#FFFFFF',
        secondary: '#AEB3B8',
        muted: '#8E9398',
        inverse: '#16181D', // For text on light backgrounds
      },
      
      // Background Colors
      background: {
        primary: '#16181D',
        secondary: '#1F2329',
        tertiary: '#2A2E35',
        card: '#1F2329',
        hover: '#2A2E35',
      },
      
      // Border Colors
      border: {
        primary: '#AEB3B8',
        secondary: '#2A2E35',
        accent: '#2FB8A8',
      },
      
      // Status Colors
      status: {
        online: '#2FB8A8',
        offline: '#AEB3B8',
        error: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
      },
      
      // Message Colors
      message: {
        own: '#2FB8A8',
        ownText: '#FFFFFF',
        other: '#2A2E35',
        otherText: '#FFFFFF',
      },
    },
    
    // Typography
    typography: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem', // 30px
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    
    // Spacing
    spacing: {
      xs: '0.25rem',   // 4px
      sm: '0.5rem',    // 8px
      md: '1rem',      // 16px
      lg: '1.5rem',    // 24px
      xl: '2rem',      // 32px
      '2xl': '3rem',   // 48px
    },
    
    // Border Radius
    borderRadius: {
      sm: '0.25rem',   // 4px
      md: '0.5rem',    // 8px
      lg: '0.75rem',   // 12px
      full: '9999px',
    },
    
    // Shadows (minimal for corporate look)
    shadows: {
      none: 'none',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    
    // Transitions
    transitions: {
      fast: '150ms ease-in-out',
      normal: '200ms ease-in-out',
      slow: '300ms ease-in-out',
    },
  } as const
  
  // Utility functions for easy access
  export const getColor = (path: string): string => {
    const keys = path.split('.')
    let value: any = theme.colors
    for (const key of keys) {
      value = value[key]
      if (value === undefined) {
        console.warn(`Color path "${path}" not found`)
        return '#000000'
      }
    }
    return value
  }
  
  // Tailwind CSS class generators
  export const themeClasses = {
    // Backgrounds
    bgPrimary: 'bg-[#16181D]',
    bgSecondary: 'bg-[#1F2329]',
    bgTertiary: 'bg-[#2A2E35]',
    bgAccent: 'bg-[#2FB8A8]',
    bgAccentHover: 'hover:bg-[#28A896]',
    
    // Text
    textPrimary: 'text-white',
    textSecondary: 'text-[#AEB3B8]',
    textMuted: 'text-[#8E9398]',
    textAccent: 'text-[#2FB8A8]',
    
    // Borders
    borderPrimary: 'border-[#AEB3B8]',
    borderSecondary: 'border-[#2A2E35]',
    borderAccent: 'border-[#2FB8A8]',
    
    // Buttons
    btnPrimary: 'bg-[#2FB8A8] text-white hover:bg-[#28A896]',
    btnSecondary: 'bg-[#2A2E35] text-white hover:bg-[#1F2329]',
    btnOutline: 'border border-[#2FB8A8] text-[#2FB8A8] hover:bg-[#2FB8A8] hover:text-white',
    
    // Cards
    card: 'bg-[#1F2329] border border-[#AEB3B8]',
    cardHover: 'hover:bg-[#2A2E35]',
  }
  
  // React style object helpers
  export const themeStyles = {
    // Backgrounds
    bgPrimary: { backgroundColor: theme.colors.background.primary },
    bgSecondary: { backgroundColor: theme.colors.background.secondary },
    bgTertiary: { backgroundColor: theme.colors.background.tertiary },
    bgAccent: { backgroundColor: theme.colors.accent },
    
    // Text
    textPrimary: { color: theme.colors.text.primary },
    textSecondary: { color: theme.colors.text.secondary },
    textMuted: { color: theme.colors.text.muted },
    textAccent: { color: theme.colors.accent },
    
    // Borders
    borderPrimary: { borderColor: theme.colors.border.primary },
    borderSecondary: { borderColor: theme.colors.border.secondary },
    borderAccent: { borderColor: theme.colors.border.accent },
  }
  
  // Common component styles
  export const componentStyles = {
    sidebar: {
      backgroundColor: theme.colors.background.primary,
      color: theme.colors.text.primary,
    },
    sidebarItem: {
      active: {
        backgroundColor: theme.colors.accent,
        color: theme.colors.text.primary,
      },
      hover: {
        backgroundColor: theme.colors.background.tertiary,
      },
    },
    chatList: {
      backgroundColor: theme.colors.background.primary,
      borderColor: theme.colors.border.primary,
    },
    chatItem: {
      selected: {
        backgroundColor: theme.colors.accent,
        color: theme.colors.text.primary,
      },
      hover: {
        backgroundColor: theme.colors.background.tertiary,
      },
    },
    message: {
      own: {
        backgroundColor: theme.colors.message.own,
        color: theme.colors.message.ownText,
      },
      other: {
        backgroundColor: theme.colors.message.other,
        color: theme.colors.message.otherText,
      },
    },
    button: {
      primary: {
        backgroundColor: theme.colors.accent,
        color: theme.colors.text.primary,
      },
      secondary: {
        backgroundColor: theme.colors.background.tertiary,
        color: theme.colors.text.primary,
      },
    },
  }