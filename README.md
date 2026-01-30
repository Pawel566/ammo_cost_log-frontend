# 🎯 Ammo Cost Log - Frontend

React frontend do aplikacji zarządzania strzelectwem z inteligentnym asystentem AI.

## ✨ Funkcjonalności

- **Zarządzanie sprzętem** - katalog broni i amunicji z cenami
- **Śledzenie kosztów** - sesje strzeleckie z automatycznym obliczaniem wydatków
- **Analiza celności** - pomiar wyników z komentarzami AI (`gpt-4o-mini`)
- **Statystyki** - miesięczne podsumowania i wykresy
- **Tryb gościa i logowanie** - obsługa sesji sandboxowych i użytkowników Supabase
- **Wielojęzyczność** - wsparcie dla języka polskiego i angielskiego
- **Obsługa wielu walut** - automatyczna konwersja między PLN USD, EUR, GBP z aktualnymi kursami z API NBP
- **Jednostki odległości** - wybór między metrami a yardami w ustawieniach użytkownika
- **Rozszerzona konserwacja** - 25 czynności serwisowych zorganizowanych w sekcje tematyczne

## 🛠️ Technologie

React, Vite, React Router, CSS3

## 🚀 Instalacja

```bash
npm install
npm run dev
```

**Dostęp**: http://localhost:3000  
**Wymagania**: Backend uruchomiony na porcie 8000

## 📱 Strony aplikacji
d
- **Strona główna** (`/`) - opis aplikacji i nawigacja
- **Broń** (`/guns`) - zarządzanie bronią
- **Moja broń** (`/my-weapons`) - przegląd posiadanej broni
- **Amunicja** (`/ammo`) - zarządzanie amunicją
- **Sesje kosztowe** (`/cost-sessions`) - historia sesji z filtrowaniem
- **Sesje strzeleckie** (`/shooting-sessions`) - zarządzanie sesjami strzeleckimi
- **Dodaj sesję strzelecką** (`/add-shooting-session`) - tworzenie nowej sesji
- **Sesje celnościowe** (`/accuracy-sessions`) - analiza celności z AI
- **Konserwacja** (`/maintenance`) - zarządzanie konserwacją broni
- **Podsumowanie** (`/summary`) - statystyki i wykresy
- **Ustawienia** (`/settings`) - konfiguracja użytkownika
- **Moje konto** (`/account`) - zarządzanie kontem użytkownika

## 🎨 Design

Szary motyw (#545454) z białym tekstem i zielonymi akcentami (#4caf50). Responsywny layout. Wsparcie dla jasnego i ciemnego motywu.

## 🚀 Deployment

Automatyczny deployment na Vercel przez GitHub.

## 🔐 Autentykacja i Race Condition Prevention

### ⚠️ WAŻNE: authReady - obowiązkowe dla requestów zależnych od usera

**Każdy nowy context / hook / strona zależna od usera MUSI czekać na `authReady`** przed wykonaniem requestów zależnych od autentykacji.

#### Problem
Po logowaniu token jest zapisany w `localStorage`, ale requesty mogą być wysłane zanim token jest w pełni zweryfikowany przez `/auth/me`, co powoduje błędy 500/404.

#### Rozwiązanie
Używaj `authReady` zamiast sprawdzania tylko `user`:

```jsx
// ❌ BŁĘDNE - może powodować race condition
const { user } = useAuth();
useEffect(() => {
  if (user) {
    settingsAPI.get(); // Może się wykonać zanim token jest gotowy!
  }
}, [user]);

// ✅ POPRAWNE - bezpieczne
const { user, authReady } = useAuth();
useEffect(() => {
  if (authReady && user) {
    settingsAPI.get(); // Bezpieczne - token jest zweryfikowany
  }
}, [user, authReady]);
```

#### Kiedy `authReady` jest `true`?
- Token został zweryfikowany przez `/auth/me` (dla zalogowanych użytkowników)
- Wymagane jest zalogowanie się do aplikacji

#### Przykłady poprawnego użycia
- ✅ `ThemeContext` - czeka na `authReady` przed `settingsAPI.get()`
- ✅ `CurrencyContext` - czeka na `authReady` przed `settingsAPI.get()`
- ✅ `LanguageContext` - czeka na `authReady` przed `settingsAPI.get()`
- ✅ `DashboardPage` - czeka na `authReady` przed requestami
- ✅ `SettingsPage` - czeka na `authReady` przed `fetchSettings()`
- ✅ `AccountPage` - czeka na `authReady` przed `fetchSkillLevel()` i `fetchRank()`

#### Retry dla błędów 404/500
Wszystkie konteksty mają wbudowany retry dla błędów 404/500 na pierwszym loadzie (graceful fallback).

## 📜 Changelog

Zobacz pełną historię zmian → [CHANGELOG.md](CHANGELOG.md)

## 🔮 Plany

- Widoki akcesoriów i dodatków do broni
- Panel serwisowy z harmonogramem konserwacji
- Rozszerzona personalizacja komentarzy AI
- System poziomów doświadczenia strzelca
- Komentarze AI zależne od poziomu umiejętności użytkownika