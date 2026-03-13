import { useTranslation } from 'react-i18next'
import { useTheme } from '../contexts/ThemeContext'
import { Moon, Sun, Globe, Search, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  HelpCircle,
  MessageSquare,
  BarChart3,
} from 'lucide-react'
import { cn } from '../lib/utils'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'

import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar'
import { useState, useEffect } from 'react'

export function Navbar() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const location = useLocation()

  const [targetRole, setTargetRole] = useState<string | null>(null)

  const menuItems = [
    { label: t("sidebar.dashboard"), href: "/dashboard" },
    { label: "Practice", href: "/practice" },
    { label: t("sidebar.questionBank"), href: "/question-bank" },
    { label: t("sidebar.feedback"), href: "/feedback" },
    { label: t("sidebar.analytics"), href: "/analytics" },
  ]

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        setTargetRole(userData.targetRoleName || null)
      } catch {
        setTargetRole(null)
      }
    }
  }, [])

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('language', lng)
  }

  const languages = [
    { code: 'en', label: t('language.en') },
    { code: 'vi', label: t('language.vi') },
    { code: 'jp', label: t('language.jp') },
  ]

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6 gap-6">

        {/* LOGO */}

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow">
            ID
          </div>

          <div className="hidden sm:flex flex-col">
            <Link to="/homepage">
              <span className="text-sm font-bold text-foreground">
                {t('navbar.logo')}
              </span>
            </Link>

            {targetRole && (
              <Badge variant="secondary" className="w-fit text-xs">
                {targetRole}
              </Badge>
            )}
          </div>
        </div>

        {/* MENU */}

        <div className="hidden lg:flex items-center gap-6">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* SEARCH */}

        <div className="hidden md:flex items-center relative w-64">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Search..."
            className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>

        {/* RIGHT SIDE */}

        <div className="flex items-center gap-3">

          {/* Upgrade */}

          <Button
            size="sm"
            className="hidden md:flex bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-90"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Upgrade
          </Button>

          {/* Language */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={i18n.language === lang.code ? 'bg-accent' : ''}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {theme === 'dark' ||
                  (theme === 'system' &&
                    document.documentElement.classList.contains('dark')) ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                {t('theme.light')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                {t('theme.dark')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                {t('theme.system')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Avatar */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>ID</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem>{t('sidebar.profile')}</DropdownMenuItem>
              <DropdownMenuItem>{t('sidebar.logout')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </nav>
  )
}