import { Injectable, signal, effect } from '@angular/core';

export interface Theme {
  mode: 'light' | 'dark';
  color: 'base' | 'yellow' | 'green' | 'blue' | 'orange' | 'red' | 'violet';
  direction: 'ltr' | 'rtl';
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  public theme = signal<Theme>({ mode: 'dark', color: 'base', direction: 'ltr' });

  /** Central list of allowed colors */
  public readonly allowedColors: { name: Theme['color']; code: string }[] = [
    { name: 'base', code: '#e11d48' },
    { name: 'yellow', code: '#f59e0b' },
    { name: 'green', code: '#10b981' },
    { name: 'blue', code: '#3b82f6' },
    { name: 'orange', code: '#f97316' },
    { name: 'red', code: '#ef4444' },
    { name: 'violet', code: '#8b5cf6' }
  ];

  /** Allowed text directions */
  public readonly allowedDirections: Theme['direction'][] = ['ltr', 'rtl'];

  constructor() {
    this.loadTheme();
    effect(() => {
      this.setConfig();
    });
  }

  private loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme) {
      this.theme.set(JSON.parse(theme) as Theme);
    }
  }

  private setConfig() {
    this.setLocalStorage();
    this.setThemeClass();
    this.setRTL();
  }

  get isDark(): boolean {
    return this.theme().mode === 'dark';
  }

  toggleThemeMode() {
    this.theme.update(theme => ({
      ...theme,
      mode: theme.mode === 'dark' ? 'light' : 'dark',
    }));
  }

  toggleThemeColor(color: Theme['color']) {
    this.theme.update(theme => ({ ...theme, color }));
  }

  setDirection(value: Theme['direction']) {
    this.theme.update(theme => ({ ...theme, direction: value }));
  }

  private setThemeClass() {
    document.documentElement.className = this.theme().mode;
    document.documentElement.setAttribute('data-theme', this.theme().color);
  }

  private setLocalStorage() {
    localStorage.setItem('theme', JSON.stringify(this.theme()));
  }

  private setRTL() {
    document.documentElement.setAttribute('dir', this.theme().direction);
  }
}
