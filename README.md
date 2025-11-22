# 🎯 Ammo Cost Log - Frontend

React frontend do aplikacji zarządzania strzelectwem z inteligentnym asystentem AI.

## ✨ Funkcjonalności

- **Zarządzanie sprzętem** - katalog broni i amunicji z cenami
- **Śledzenie kosztów** - sesje strzeleckie z automatycznym obliczaniem wydatków
- **Analiza celności** - pomiar wyników z komentarzami AI (`gpt-4o-mini`)
- **Statystyki** - miesięczne podsumowania i wykresy
- **Tryb gościa i logowanie** - obsługa sesji sandboxowych i użytkowników Supabase

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

Szary motyw (#545454) z białym tekstem i zielonymi akcentami (#4caf50). Responsywny layout.

## 🚀 Deployment

Automatyczny deployment na Vercel przez GitHub.

## 📜 Changelog

Zobacz pełną historię zmian → [CHANGELOG.md](CHANGELOG.md)

## 🔮 Plany

- Widoki akcesoriów i dodatków do broni
- Panel serwisowy z harmonogramem konserwacji
- Rozszerzona personalizacja komentarzy AI
- System poziomów doświadczenia strzelca
- Komentarze AI zależne od poziomu umiejętności użytkownika