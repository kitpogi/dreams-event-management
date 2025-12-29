/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			// shadcn/ui semantic colors
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))',
  				50: 'hsl(var(--primary-50))',
  				100: 'hsl(var(--primary-100))',
  				200: 'hsl(var(--primary-200))',
  				300: 'hsl(var(--primary-300))',
  				400: 'hsl(var(--primary-400))',
  				500: 'hsl(var(--primary-500))',
  				600: 'hsl(var(--primary-600))',
  				700: 'hsl(var(--primary-700))',
  				800: 'hsl(var(--primary-800))',
  				900: 'hsl(var(--primary-900))',
  				950: 'hsl(var(--primary-950))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))',
  				50: 'hsl(var(--secondary-50))',
  				100: 'hsl(var(--secondary-100))',
  				200: 'hsl(var(--secondary-200))',
  				300: 'hsl(var(--secondary-300))',
  				400: 'hsl(var(--secondary-400))',
  				500: 'hsl(var(--secondary-500))',
  				600: 'hsl(var(--secondary-600))',
  				700: 'hsl(var(--secondary-700))',
  				800: 'hsl(var(--secondary-800))',
  				900: 'hsl(var(--secondary-900))',
  				950: 'hsl(var(--secondary-950))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))',
  				50: 'hsl(var(--destructive-50))',
  				100: 'hsl(var(--destructive-100))',
  				200: 'hsl(var(--destructive-200))',
  				300: 'hsl(var(--destructive-300))',
  				400: 'hsl(var(--destructive-400))',
  				500: 'hsl(var(--destructive-500))',
  				600: 'hsl(var(--destructive-600))',
  				700: 'hsl(var(--destructive-700))',
  				800: 'hsl(var(--destructive-800))',
  				900: 'hsl(var(--destructive-900))',
  				950: 'hsl(var(--destructive-950))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))',
  				50: 'hsl(var(--muted-50))',
  				100: 'hsl(var(--muted-100))',
  				200: 'hsl(var(--muted-200))',
  				300: 'hsl(var(--muted-300))',
  				400: 'hsl(var(--muted-400))',
  				500: 'hsl(var(--muted-500))',
  				600: 'hsl(var(--muted-600))',
  				700: 'hsl(var(--muted-700))',
  				800: 'hsl(var(--muted-800))',
  				900: 'hsl(var(--muted-900))',
  				950: 'hsl(var(--muted-950))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))',
  				50: 'hsl(var(--accent-50))',
  				100: 'hsl(var(--accent-100))',
  				200: 'hsl(var(--accent-200))',
  				300: 'hsl(var(--accent-300))',
  				400: 'hsl(var(--accent-400))',
  				500: 'hsl(var(--accent-500))',
  				600: 'hsl(var(--accent-600))',
  				700: 'hsl(var(--accent-700))',
  				800: 'hsl(var(--accent-800))',
  				900: 'hsl(var(--accent-900))',
  				950: 'hsl(var(--accent-950))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			// Semantic colors with full scale
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))',
  				50: 'hsl(var(--success-50))',
  				100: 'hsl(var(--success-100))',
  				200: 'hsl(var(--success-200))',
  				300: 'hsl(var(--success-300))',
  				400: 'hsl(var(--success-400))',
  				500: 'hsl(var(--success-500))',
  				600: 'hsl(var(--success-600))',
  				700: 'hsl(var(--success-700))',
  				800: 'hsl(var(--success-800))',
  				900: 'hsl(var(--success-900))',
  				950: 'hsl(var(--success-950))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))',
  				50: 'hsl(var(--warning-50))',
  				100: 'hsl(var(--warning-100))',
  				200: 'hsl(var(--warning-200))',
  				300: 'hsl(var(--warning-300))',
  				400: 'hsl(var(--warning-400))',
  				500: 'hsl(var(--warning-500))',
  				600: 'hsl(var(--warning-600))',
  				700: 'hsl(var(--warning-700))',
  				800: 'hsl(var(--warning-800))',
  				900: 'hsl(var(--warning-900))',
  				950: 'hsl(var(--warning-950))'
  			},
  			error: {
  				DEFAULT: 'hsl(var(--error))',
  				foreground: 'hsl(var(--error-foreground))',
  				50: 'hsl(var(--error-50))',
  				100: 'hsl(var(--error-100))',
  				200: 'hsl(var(--error-200))',
  				300: 'hsl(var(--error-300))',
  				400: 'hsl(var(--error-400))',
  				500: 'hsl(var(--error-500))',
  				600: 'hsl(var(--error-600))',
  				700: 'hsl(var(--error-700))',
  				800: 'hsl(var(--error-800))',
  				900: 'hsl(var(--error-900))',
  				950: 'hsl(var(--error-950))'
  			},
  			info: {
  				DEFAULT: 'hsl(var(--info))',
  				foreground: 'hsl(var(--info-foreground))',
  				50: 'hsl(var(--info-50))',
  				100: 'hsl(var(--info-100))',
  				200: 'hsl(var(--info-200))',
  				300: 'hsl(var(--info-300))',
  				400: 'hsl(var(--info-400))',
  				500: 'hsl(var(--info-500))',
  				600: 'hsl(var(--info-600))',
  				700: 'hsl(var(--info-700))',
  				800: 'hsl(var(--info-800))',
  				900: 'hsl(var(--info-900))',
  				950: 'hsl(var(--info-950))'
  			},
  			// Brand colors with full scale
  			brand: {
  				primary: {
  					DEFAULT: 'hsl(var(--brand-primary))',
  					50: 'hsl(var(--brand-primary-50))',
  					100: 'hsl(var(--brand-primary-100))',
  					200: 'hsl(var(--brand-primary-200))',
  					300: 'hsl(var(--brand-primary-300))',
  					400: 'hsl(var(--brand-primary-400))',
  					500: 'hsl(var(--brand-primary-500))',
  					600: 'hsl(var(--brand-primary-600))',
  					700: 'hsl(var(--brand-primary-700))',
  					800: 'hsl(var(--brand-primary-800))',
  					900: 'hsl(var(--brand-primary-900))',
  					950: 'hsl(var(--brand-primary-950))'
  				},
  				secondary: {
  					DEFAULT: 'hsl(var(--brand-secondary))',
  					50: 'hsl(var(--brand-secondary-50))',
  					100: 'hsl(var(--brand-secondary-100))',
  					200: 'hsl(var(--brand-secondary-200))',
  					300: 'hsl(var(--brand-secondary-300))',
  					400: 'hsl(var(--brand-secondary-400))',
  					500: 'hsl(var(--brand-secondary-500))',
  					600: 'hsl(var(--brand-secondary-600))',
  					700: 'hsl(var(--brand-secondary-700))',
  					800: 'hsl(var(--brand-secondary-800))',
  					900: 'hsl(var(--brand-secondary-900))',
  					950: 'hsl(var(--brand-secondary-950))'
  				},
  				accent: {
  					DEFAULT: 'hsl(var(--brand-accent))',
  					50: 'hsl(var(--brand-accent-50))',
  					100: 'hsl(var(--brand-accent-100))',
  					200: 'hsl(var(--brand-accent-200))',
  					300: 'hsl(var(--brand-accent-300))',
  					400: 'hsl(var(--brand-accent-400))',
  					500: 'hsl(var(--brand-accent-500))',
  					600: 'hsl(var(--brand-accent-600))',
  					700: 'hsl(var(--brand-accent-700))',
  					800: 'hsl(var(--brand-accent-800))',
  					900: 'hsl(var(--brand-accent-900))',
  					950: 'hsl(var(--brand-accent-950))'
  				}
  			},
  			// Legacy brand color support (for backward compatibility)
  			'brand-primary': '#5A45F2',
  			'brand-secondary': '#7c3aed',
  			'brand-accent': '#7ee5ff',
  			'background-light': '#f9f5ff',
  			'background-dark': '#1c1022',
  			'indigo-primary': '#4F46E5',
  			'indigo-secondary': '#6366F1'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			DEFAULT: '0.5rem',
  			xl: '0.75rem',
  			full: '9999px'
  		},
  		fontFamily: {
  			sans: [
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Oxygen',
  				'Ubuntu',
  				'Cantarell',
  				'Fira Sans',
  				'Droid Sans',
  				'Helvetica Neue',
  				'sans-serif'
  			],
  			display: [
  				'Manrope',
  				'Epilogue',
  				'sans-serif'
  			],
  			serif: [
  				'Georgia',
  				'Cambria',
  				'"Times New Roman"',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'"Liberation Mono"',
  				'"Courier New"',
  				'monospace'
  			]
  		},
  		fontSize: {
  			// Heading scale
  			'h1': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }], // 56px
  			'h2': ['2.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }], // 44px
  			'h3': ['2.25rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }], // 36px
  			'h4': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.005em', fontWeight: '600' }], // 30px
  			'h5': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '600' }], // 24px
  			'h6': ['1.25rem', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '600' }], // 20px
  			// Body text sizes
  			'body-xl': ['1.25rem', { lineHeight: '1.75', letterSpacing: '0', fontWeight: '400' }], // 20px
  			'body-lg': ['1.125rem', { lineHeight: '1.75', letterSpacing: '0', fontWeight: '400' }], // 18px
  			'body': ['1rem', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }], // 16px
  			'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em', fontWeight: '400' }], // 14px
  			'body-xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.01em', fontWeight: '400' }], // 12px
  			// Display sizes (for hero sections, etc.)
  			'display-2xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '800' }], // 72px
  			'display-xl': ['3.75rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '800' }], // 60px
  			'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }], // 48px
  			// Legacy support
  			'xs': ['0.75rem', { lineHeight: '1.5' }],
  			'sm': ['0.875rem', { lineHeight: '1.5' }],
  			'base': ['1rem', { lineHeight: '1.5' }],
  			'lg': ['1.125rem', { lineHeight: '1.75' }],
  			'xl': ['1.25rem', { lineHeight: '1.75' }],
  			'2xl': ['1.5rem', { lineHeight: '2' }],
  			'3xl': ['2.25rem', { lineHeight: '2.25' }],
  			'4xl': ['2.5rem', { lineHeight: '2.5' }],
  			'5xl': ['3rem', { lineHeight: '1' }],
  			'6xl': ['3.75rem', { lineHeight: '1' }],
  			'7xl': ['4.5rem', { lineHeight: '1' }],
  			'8xl': ['6rem', { lineHeight: '1' }],
  			'9xl': ['8rem', { lineHeight: '1' }]
  		},
  		fontWeight: {
  			thin: '100',
  			extralight: '200',
  			light: '300',
  			normal: '400',
  			medium: '500',
  			semibold: '600',
  			bold: '700',
  			extrabold: '800',
  			black: '900'
  		},
  		lineHeight: {
  			none: '1',
  			tight: '1.25',
  			snug: '1.375',
  			normal: '1.5',
  			relaxed: '1.625',
  			loose: '2',
  			// Custom line heights
  			'heading-tight': '1.1',
  			'heading-normal': '1.2',
  			'body-tight': '1.4',
  			'body-normal': '1.5',
  			'body-relaxed': '1.75'
  		},
		letterSpacing: {
			tighter: '-0.05em',
			tight: '-0.025em',
			normal: '0em',
			wide: '0.025em',
			wider: '0.05em',
			widest: '0.1em',
			// Custom letter spacing
			'heading-tight': '-0.02em',
			'heading-normal': '-0.01em',
			'body-tight': '0',
			'body-wide': '0.01em',
			'uppercase-wide': '0.05em'
		},
		spacing: {
			// Base spacing scale (4px base unit)
			// Standard Tailwind spacing (0-96) is preserved
			// Additional semantic spacing tokens
			'component-xs': 'var(--spacing-component-xs)',      // 0.25rem (4px) - tight spacing
			'component-sm': 'var(--spacing-component-sm)',     // 0.5rem (8px) - small spacing
			'component-md': 'var(--spacing-component-md)',     // 1rem (16px) - medium spacing
			'component-lg': 'var(--spacing-component-lg)',     // 1.5rem (24px) - large spacing
			'component-xl': 'var(--spacing-component-xl)',      // 2rem (32px) - extra large spacing
			'component-2xl': 'var(--spacing-component-2xl)',   // 3rem (48px) - 2x large spacing
			'component-3xl': 'var(--spacing-component-3xl)',   // 4rem (64px) - 3x large spacing
			'section-xs': 'var(--spacing-section-xs)',         // 2rem (32px) - small section spacing
			'section-sm': 'var(--spacing-section-sm)',         // 3rem (48px) - medium section spacing
			'section-md': 'var(--spacing-section-md)',         // 4rem (64px) - standard section spacing
			'section-lg': 'var(--spacing-section-lg)',         // 6rem (96px) - large section spacing
			'section-xl': 'var(--spacing-section-xl)',         // 8rem (128px) - extra large section spacing
			'section-2xl': 'var(--spacing-section-2xl)',       // 12rem (192px) - 2x large section spacing
			'layout-xs': 'var(--spacing-layout-xs)',           // 1rem (16px) - small layout spacing
			'layout-sm': 'var(--spacing-layout-sm)',           // 1.5rem (24px) - medium layout spacing
			'layout-md': 'var(--spacing-layout-md)',           // 2rem (32px) - standard layout spacing
			'layout-lg': 'var(--spacing-layout-lg)',           // 3rem (48px) - large layout spacing
			'layout-xl': 'var(--spacing-layout-xl)',           // 4rem (64px) - extra large layout spacing
		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
    require("tailwindcss-animate"),
  ],
}